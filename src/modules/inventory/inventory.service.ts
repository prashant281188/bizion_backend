import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "../../config/db";
import * as schema from "../../db/schema";
import { inventory, inventoryTransactions } from "../../db/schema";
import { dispatches, dispatchItems, orders, orderItems, purchaseReceipts, purchaseReceiptItems } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import {
  AdjustInventoryInput,
  CreateTransactionInput,
  ListInventoryInput,
  ListTransactionInput,
} from "./inventory.schema";

type TxOrDb =
  | typeof db
  | PgTransaction<PostgresJsQueryResultHKT, typeof schema, any>;

// Upsert inventory row for a variant+location and apply a partial update
async function upsertInventory(
  tx: TxOrDb,
  variantId: string,
  location: string,
  patch: Partial<{
    quantityOnHandDelta: number;
    quantityReservedDelta: number;
    quantityOrderedDelta: number;
    quantityToOrderDelta: number;
  }>
) {
  const existing = await tx
    .select()
    .from(inventory)
    .where(and(eq(inventory.variantId, variantId), eq(inventory.location, location)))
    .limit(1);

  if (existing.length) {
    const row = existing[0];
    const newOnHand = row.quantityOnHand + (patch.quantityOnHandDelta ?? 0);
    const newReserved = row.quantityReserved + (patch.quantityReservedDelta ?? 0);
    const newOrdered = row.quantityOrdered + (patch.quantityOrderedDelta ?? 0);
    const newToOrder = row.quantityToOrder + (patch.quantityToOrderDelta ?? 0);

    if (newOnHand < 0) throw new AppError(`Insufficient stock on hand at '${location}'`, 400);
    if (newReserved < 0) throw new AppError(`Reserved qty cannot go below zero at '${location}'`, 400);
    if (newOrdered < 0) throw new AppError(`Ordered qty cannot go below zero at '${location}'`, 400);

    await tx
      .update(inventory)
      .set({
        quantityOnHand: newOnHand,
        quantityReserved: newReserved,
        quantityOrdered: newOrdered,
        quantityToOrder: Math.max(0, newToOrder),
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, row.id));
  } else {
    const onHand = patch.quantityOnHandDelta ?? 0;
    const reserved = patch.quantityReservedDelta ?? 0;
    const ordered = patch.quantityOrderedDelta ?? 0;
    const toOrder = patch.quantityToOrderDelta ?? 0;

    if (onHand < 0) throw new AppError(`No stock at '${location}' to deduct from`, 400);
    if (reserved < 0) throw new AppError(`Cannot reserve negative qty at '${location}'`, 400);

    await tx.insert(inventory).values({
      variantId,
      location,
      quantityOnHand: onHand,
      quantityReserved: reserved,
      quantityOrdered: ordered,
      quantityToOrder: Math.max(0, toOrder),
    });
  }
}

export const inventoryService = {
  async listStock({ page, limit, variantId, location }: ListInventoryInput) {
    const conditions = [];
    if (variantId) conditions.push(eq(inventory.variantId, variantId));
    if (location) conditions.push(eq(inventory.location, location));
    const where = conditions.length ? and(...conditions) : undefined;

    const baseQuery = db.select().from(inventory).where(where).orderBy(asc(inventory.location));

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? baseQuery.limit(limit).offset(((page ?? 1) - 1) * limit)
        : baseQuery,
      db.select({ count: sql<number>`count(*)` }).from(inventory).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: { page: resolvedPage, limit: resolvedLimit, total, totalPages: limit ? Math.ceil(total / limit) : 1 },
    };
  },

  async getStockByVariant(variantId: string) {
    const rows = await db.select().from(inventory).where(eq(inventory.variantId, variantId));
    const totals = rows.reduce(
      (acc, r) => ({
        quantityOnHand: acc.quantityOnHand + r.quantityOnHand,
        quantityReserved: acc.quantityReserved + r.quantityReserved,
        quantityOrdered: acc.quantityOrdered + r.quantityOrdered,
        quantityToOrder: acc.quantityToOrder + r.quantityToOrder,
        availableToSell: acc.availableToSell + (r.quantityOnHand - r.quantityReserved),
      }),
      { quantityOnHand: 0, quantityReserved: 0, quantityOrdered: 0, quantityToOrder: 0, availableToSell: 0 }
    );
    return { locations: rows, totals };
  },

  async listTransactions({ page, limit, variantId, partyId, type, location }: ListTransactionInput) {
    const conditions = [];
    if (variantId) conditions.push(eq(inventoryTransactions.variantId, variantId));
    if (partyId) conditions.push(eq(inventoryTransactions.partyId, partyId));
    if (type) conditions.push(eq(inventoryTransactions.type, type));
    if (location) conditions.push(eq(inventoryTransactions.location, location));
    const where = conditions.length ? and(...conditions) : undefined;

    const baseQuery = db.select().from(inventoryTransactions).where(where).orderBy(desc(inventoryTransactions.createdAt));

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? baseQuery.limit(limit).offset(((page ?? 1) - 1) * limit)
        : baseQuery,
      db.select({ count: sql<number>`count(*)` }).from(inventoryTransactions).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: { page: resolvedPage, limit: resolvedLimit, total, totalPages: limit ? Math.ceil(total / limit) : 1 },
    };
  },

  async createTransaction(data: CreateTransactionInput) {
    return await db.transaction(async (tx) => {
      const { variantId, quantity, location, type } = data;

      await upsertInventory(tx, variantId, location, {
        quantityOnHandDelta: quantity,
      });

      const [txRecord] = await tx
        .insert(inventoryTransactions)
        .values({ variantId, partyId: data.partyId, type, quantity, location, note: data.note })
        .returning();

      return txRecord;
    });
  },

  async adjustStock(data: AdjustInventoryInput) {
    const { variantId, location, quantity, note } = data;

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(inventory)
        .where(and(eq(inventory.variantId, variantId), eq(inventory.location, location)))
        .limit(1);

      const prevQty = existing.length ? existing[0].quantityOnHand : 0;
      const delta = quantity - prevQty;

      if (existing.length) {
        await tx.update(inventory).set({ quantityOnHand: quantity, updatedAt: new Date() }).where(eq(inventory.id, existing[0].id));
      } else {
        await tx.insert(inventory).values({ variantId, location, quantityOnHand: quantity });
      }

      if (delta !== 0) {
        await tx.insert(inventoryTransactions).values({
          variantId,
          type: "adjustment",
          quantity: delta,
          location,
          note: note ?? `Adjusted from ${prevQty} to ${quantity}`,
        });
      }

      return { variantId, location, previousQuantity: prevQty, newQuantity: quantity, delta };
    });
  },

  // ─── Dispatch hooks ──────────────────────────────────────────────────────────

  /**
   * Called when a dispatch is created (status = pending).
   * Reserves stock for each dispatch item.
   */
  async onDispatchCreated(dispatchId: string) {
    const items = await db.select().from(dispatchItems).where(eq(dispatchItems.dispatchId, dispatchId));
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        await upsertInventory(tx, item.variantId, "default", {
          quantityReservedDelta: item.totalQty,
        });
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          type: "transfer",
          quantity: 0,
          location: "default",
          note: `Reserved ${item.totalQty} for dispatch ${dispatchId}`,
        });
      }
    });
  },

  /**
   * Called when dispatch status changes to shipped or delivered.
   * Deducts from quantityOnHand and releases quantityReserved.
   */
  async onDispatchShipped(dispatchId: string) {
    const items = await db.select().from(dispatchItems).where(eq(dispatchItems.dispatchId, dispatchId));
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        await upsertInventory(tx, item.variantId, "default", {
          quantityOnHandDelta: -item.totalQty,
          quantityReservedDelta: -item.totalQty,
        });
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          type: "sale",
          quantity: -item.totalQty,
          location: "default",
          note: `Dispatched ${item.totalQty} via dispatch ${dispatchId}`,
        });
      }
    });
  },

  /**
   * Called when a dispatch is cancelled.
   * Releases the reserved stock.
   */
  async onDispatchCancelled(dispatchId: string) {
    const items = await db.select().from(dispatchItems).where(eq(dispatchItems.dispatchId, dispatchId));
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        await upsertInventory(tx, item.variantId, "default", {
          quantityReservedDelta: -item.totalQty,
        });
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          type: "adjustment",
          quantity: 0,
          location: "default",
          note: `Released reservation of ${item.totalQty} — dispatch ${dispatchId} cancelled`,
        });
      }
    });
  },

  // ─── Purchase Order hooks ────────────────────────────────────────────────────

  /**
   * Called when a purchase order is confirmed.
   * Increases quantityOrdered for each order item.
   */
  async onPurchaseOrderConfirmed(orderId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.orderType !== "purchase") return;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        if (!item.variantId || !item.orderQty) continue;
        await upsertInventory(tx, item.variantId, "default", {
          quantityOrderedDelta: Number(item.orderQty),
        });
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          type: "purchase",
          quantity: Number(item.orderQty),
          location: "default",
          note: `Purchase order ${orderId} confirmed — ${item.orderQty} units on order`,
        });
      }
    });
  },

  /**
   * Called when a purchase receipt is saved.
   * Increases quantityOnHand and decreases quantityOrdered for received items.
   */
  async onPurchaseReceiptCreated(receiptId: string) {
    const items = await db
      .select()
      .from(purchaseReceiptItems)
      .where(eq(purchaseReceiptItems.receipt_id, receiptId));
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        if (!item.variant_id || !item.totalQty) continue;
        await upsertInventory(tx, item.variant_id, "default", {
          quantityOnHandDelta: item.totalQty,
          quantityOrderedDelta: -item.totalQty,
        });
        await tx.insert(inventoryTransactions).values({
          variantId: item.variant_id,
          type: "purchase",
          quantity: item.totalQty,
          location: "default",
          note: `Received ${item.totalQty} units via receipt ${receiptId}`,
        });
      }
    });
  },
};
