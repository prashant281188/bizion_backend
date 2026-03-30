import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { fieldOrders, fieldOrderItems, parties, users } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import {
  AddItemInput,
  CreateFieldOrderInput,
  ListFieldOrderInput,
  UpdateFieldOrderInput,
  UpdateItemInput,
} from "./fieldOrder.schema";

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

/* ── helpers ──────────────────────────────────────────── */

function calcAmount(boxQty: number, ratePerBox: number): string {
  return (boxQty * ratePerBox).toFixed(2);
}

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(fieldOrders);
  const seq = String(Number(count) + 1).padStart(4, "0");
  return `ORD-${datePart}-${seq}`;
}

async function recalcOrderTotal(tx: DbOrTx, orderId: string) {
  const [{ total }] = await tx
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(fieldOrderItems)
    .where(eq(fieldOrderItems.orderId, orderId));
  await tx
    .update(fieldOrders)
    .set({ totalAmount: total, updatedAt: new Date() })
    .where(eq(fieldOrders.id, orderId));
  return total;
}

/* ── service ──────────────────────────────────────────── */

export const fieldOrderService = {
  async list({ page = 1, limit = 20, partyId, salesmanId, status }: ListFieldOrderInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (partyId) conditions.push(eq(fieldOrders.partyId, partyId));
    if (salesmanId) conditions.push(eq(fieldOrders.salesmanId, salesmanId));
    if (status) conditions.push(eq(fieldOrders.status, status));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.fieldOrders.findMany({
        where,
        limit,
        offset,
        orderBy: [asc(fieldOrders.createdAt)],
        with: {
          party: { columns: { id: true, name: true, phone: true, city: true } },
          salesman: { columns: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(fieldOrders).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const order = await db.query.fieldOrders.findFirst({
      where: eq(fieldOrders.id, id),
      with: {
        party: true,
        salesman: { columns: { id: true, firstName: true, lastName: true, phone: true } },
        items: { orderBy: [asc(fieldOrderItems.createdAt)] },
      },
    });
    if (!order) throw new AppError("Field order not found", 404);
    return order;
  },

  async create(data: CreateFieldOrderInput, salesmanId: string) {
    const orderNumber = await generateOrderNumber();

    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(fieldOrders)
        .values({ partyId: data.partyId, salesmanId, notes: data.notes, orderNumber })
        .returning();

      const itemValues = data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        finish: item.finish,
        size: item.size,
        boxQty: item.boxQty,
        ratePerBox: String(item.ratePerBox),
        amount: calcAmount(item.boxQty, item.ratePerBox),
        notes: item.notes,
      }));

      await tx.insert(fieldOrderItems).values(itemValues);

      const total = await recalcOrderTotal(tx, order.id);

      return { ...order, totalAmount: total };
    });
  },

  async update(id: string, data: UpdateFieldOrderInput) {
    // Cannot update a cancelled order
    const existing = await db.query.fieldOrders.findFirst({ where: eq(fieldOrders.id, id) });
    if (!existing) throw new AppError("Field order not found", 404);
    if (existing.status === "cancelled") throw new AppError("Cannot update a cancelled order", 400);

    const [updated] = await db
      .update(fieldOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(fieldOrders.id, id))
      .returning();

    return updated;
  },

  async addItem(orderId: string, item: AddItemInput) {
    const order = await db.query.fieldOrders.findFirst({ where: eq(fieldOrders.id, orderId) });
    if (!order) throw new AppError("Field order not found", 404);
    if (order.status === "cancelled") throw new AppError("Cannot add items to a cancelled order", 400);
    if (order.status === "confirmed") throw new AppError("Cannot add items to a confirmed order", 400);

    return db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(fieldOrderItems)
        .values({
          orderId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          finish: item.finish,
          size: item.size,
          boxQty: item.boxQty,
          ratePerBox: String(item.ratePerBox),
          amount: calcAmount(item.boxQty, item.ratePerBox),
          notes: item.notes,
        })
        .returning();

      await recalcOrderTotal(tx, orderId);
      return inserted;
    });
  },

  async updateItem(orderId: string, itemId: string, data: UpdateItemInput) {
    const order = await db.query.fieldOrders.findFirst({ where: eq(fieldOrders.id, orderId) });
    if (!order) throw new AppError("Field order not found", 404);
    if (order.status !== "draft") throw new AppError("Can only edit items on draft orders", 400);

    const item = await db.query.fieldOrderItems.findFirst({
      where: and(eq(fieldOrderItems.id, itemId), eq(fieldOrderItems.orderId, orderId)),
    });
    if (!item) throw new AppError("Order item not found", 404);

    const newBoxQty = data.boxQty ?? item.boxQty;
    const newRate = data.ratePerBox ?? Number(item.ratePerBox);
    const newAmount = calcAmount(newBoxQty, newRate);

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(fieldOrderItems)
        .set({
          ...data,
          ratePerBox: data.ratePerBox !== undefined ? String(data.ratePerBox) : undefined,
          amount: newAmount,
        })
        .where(eq(fieldOrderItems.id, itemId))
        .returning();

      await recalcOrderTotal(tx, orderId);
      return updated;
    });
  },

  async removeItem(orderId: string, itemId: string) {
    const order = await db.query.fieldOrders.findFirst({ where: eq(fieldOrders.id, orderId) });
    if (!order) throw new AppError("Field order not found", 404);
    if (order.status !== "draft") throw new AppError("Can only remove items from draft orders", 400);

    return db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(fieldOrderItems)
        .where(and(eq(fieldOrderItems.id, itemId), eq(fieldOrderItems.orderId, orderId)))
        .returning({ id: fieldOrderItems.id });

      if (!deleted) throw new AppError("Order item not found", 404);
      await recalcOrderTotal(tx, orderId);
    });
  },

  async getEstimate(id: string) {
    const order = await db.query.fieldOrders.findFirst({
      where: eq(fieldOrders.id, id),
      with: {
        party: true,
        salesman: { columns: { id: true, firstName: true, lastName: true, phone: true } },
        items: { orderBy: [asc(fieldOrderItems.createdAt)] },
      },
    });
    if (!order) throw new AppError("Field order not found", 404);

    const itemSummary = order.items.map((item, i) => ({
      sNo: i + 1,
      productName: item.productName,
      finish: item.finish ?? "-",
      size: item.size ?? "-",
      boxQty: item.boxQty,
      ratePerBox: Number(item.ratePerBox),
      amount: Number(item.amount),
      notes: item.notes,
    }));

    return {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      party: {
        name: order.party.name,
        phone: order.party.phone,
        address: order.party.address,
        city: order.party.city,
        gstNo: order.party.gstNo,
      },
      salesman: {
        name: `${order.salesman.firstName} ${order.salesman.lastName}`,
        phone: order.salesman.phone,
      },
      items: itemSummary,
      totalAmount: Number(order.totalAmount),
      totalItems: itemSummary.length,
      notes: order.notes,
    };
  },
};
