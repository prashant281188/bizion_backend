import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { inventory, inventoryTransactions } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import {
  AdjustInventoryInput,
  CreateTransactionInput,
  ListInventoryInput,
  ListTransactionInput,
} from "./inventory.schema";

export const inventoryService = {
  async listStock({ page = 1, limit = 20, variantId, location }: ListInventoryInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (variantId) conditions.push(eq(inventory.variantId, variantId));
    if (location) conditions.push(eq(inventory.location, location));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(inventory).where(where).orderBy(asc(inventory.location)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(inventory).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getStockByVariant(variantId: string) {
    const rows = await db.select().from(inventory).where(eq(inventory.variantId, variantId));
    const total = rows.reduce((sum, r) => sum + r.quantity, 0);
    return { locations: rows, total };
  },

  async listTransactions({ page = 1, limit = 20, variantId, partyId, type, location }: ListTransactionInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (variantId) conditions.push(eq(inventoryTransactions.variantId, variantId));
    if (partyId) conditions.push(eq(inventoryTransactions.partyId, partyId));
    if (type) conditions.push(eq(inventoryTransactions.type, type));
    if (location) conditions.push(eq(inventoryTransactions.location, location));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(inventoryTransactions)
        .where(where)
        .orderBy(desc(inventoryTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(inventoryTransactions).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async createTransaction(data: CreateTransactionInput) {
    return await db.transaction(async (tx) => {
      const { variantId, quantity, location, type } = data;

      // Determine stock delta: negative quantity means stock out
      const delta = quantity;

      // Upsert inventory row
      const existing = await tx
        .select()
        .from(inventory)
        .where(and(eq(inventory.variantId, variantId), eq(inventory.location, location)))
        .limit(1);

      if (existing.length) {
        const newQty = existing[0].quantity + delta;
        if (newQty < 0)
          throw new AppError(`Insufficient stock at '${location}'. Available: ${existing[0].quantity}`, 400);

        await tx
          .update(inventory)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(inventory.id, existing[0].id));
      } else {
        if (delta < 0) throw new AppError(`No stock at '${location}' to deduct from`, 400);
        await tx.insert(inventory).values({ variantId, location, quantity: delta });
      }

      const [txRecord] = await tx
        .insert(inventoryTransactions)
        .values({
          variantId,
          partyId: data.partyId,
          type,
          quantity,
          location,
          note: data.note,
        })
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

      const prevQty = existing.length ? existing[0].quantity : 0;
      const delta = quantity - prevQty;

      if (existing.length) {
        await tx
          .update(inventory)
          .set({ quantity, updatedAt: new Date() })
          .where(eq(inventory.id, existing[0].id));
      } else {
        await tx.insert(inventory).values({ variantId, location, quantity });
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
};
