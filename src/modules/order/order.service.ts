import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { orders, orderItems, parties, users } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import {
  AddItemInput,
  CreateOrderInput,
  ListOrderInput,
  UpdateOrderInput,
  UpdateItemInput,
} from "./order.schema";

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

async function generateOrderNumber(orderType: "purchase" | "sale"): Promise<string> {

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.orderType, orderType));

  const prefix = orderType === "purchase" ? "PUR" : "SALE"

  const seq = String(Number(count) + 1).padStart(4, "0");
  return `${prefix}-ORD-${seq}`;
}


async function recalcOrderTotal(tx: DbOrTx, orderId: string) {
  const [{ total }] = await tx
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  await tx
    .update(orders)
    .set({ totalAmount: total, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  return total;
}

export const orderService = {
  async nextNumber(orderType: "purchase" | "sale") {
    const orderNumber = await generateOrderNumber(orderType);
    return { orderNumber };
  },

  async list({ page = 1, limit = 20, partyId, salesmanId, orderType, status }: ListOrderInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (partyId) conditions.push(eq(orders.partyId, partyId));
    if (salesmanId) conditions.push(eq(orders.salesmanId, salesmanId));
    if (orderType) conditions.push(eq(orders.orderType, orderType));
    if (status) conditions.push(eq(orders.status, status));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.orders.findMany({
        where,
        limit,
        offset,
        orderBy: [asc(orders.createdAt)],
        with: {
          party: { columns: { id: true, name: true, phone: true, city: true } },
          salesman: { columns: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        party: true,
        salesman: { columns: { id: true, firstName: true, lastName: true, phone: true } },
        items: { orderBy: [asc(orderItems.createdAt)] },
      },
    });
    if (!order) throw new AppError("Order not found", 404);
    return order;
  },

  async create(data: CreateOrderInput, salesmanId: string) {
    const orderNumber = await generateOrderNumber(data.orderType);

    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({ partyId: data.partyId, salesmanId, notes: data.notes, orderNumber, orderType: data.orderType, orderDate: data.orderDate })
        .returning();

      const itemValues = data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        boxQty: item.boxQty,
        packing: String(item.packing),
        orderQty: item.orderQty !== undefined ? String(item.orderQty) : undefined,
        rate: String(item.rate),
        amount: String(item.amount),
        notes: item.notes,
      }));

      await tx.insert(orderItems).values(itemValues);

      const total = await recalcOrderTotal(tx, order.id);

      return { ...order, totalAmount: total };
    });
  },

  async getBalance(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: { id: true, orderNumber: true, orderType: true, status: true },
      with: {
        items: {
          columns: {
            id: true, sku: true, boxQty: true, packing: true,
            orderQty: true, fulfilledQty: true, cancelledQty: true, rate: true, amount: true,
          },
        },
      },
    });
    if (!order) throw new AppError("Order not found", 404);

    const items = order.items.map((item) => {
      const orderQty = Number(item.orderQty ?? 0);
      const fulfilledQty = Number(item.fulfilledQty ?? 0);
      const cancelledQty = Number(item.cancelledQty ?? 0);
      const remainingQty = Math.max(0, orderQty - fulfilledQty - cancelledQty);
      return { ...item, remainingQty };
    });

    return { ...order, items };
  },

  async update(id: string, data: UpdateOrderInput) {
    const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    if (!existing) throw new AppError("Order not found", 404);
    if (existing.status === "cancelled") throw new AppError("Cannot update a cancelled order", 400);

    const [updated] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return updated;
  },

  async addItem(orderId: string, item: AddItemInput) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status === "cancelled") throw new AppError("Cannot add items to a cancelled order", 400);
    if (order.status === "confirmed") throw new AppError("Cannot add items to a confirmed order", 400);

    return db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(orderItems)
        .values({
          orderId,
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          boxQty: item.boxQty,
          packing: String(item.packing),
          orderQty: item.orderQty !== undefined ? String(item.orderQty) : undefined,
          rate: String(item.rate),
          amount: String(item.amount),
          notes: item.notes,
        })
        .returning();

      await recalcOrderTotal(tx, orderId);
      return inserted;
    });
  },

  async updateItem(orderId: string, itemId: string, data: UpdateItemInput) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== "draft") throw new AppError("Can only edit items on draft orders", 400);

    const item = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)),
    });
    if (!item) throw new AppError("Order item not found", 404);

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orderItems)
        .set({
          ...data,
          packing: data.packing !== undefined ? String(data.packing) : undefined,
          orderQty: data.orderQty !== undefined ? String(data.orderQty) : undefined,
          rate: data.rate !== undefined ? String(data.rate) : undefined,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
        })
        .where(eq(orderItems.id, itemId))
        .returning();

      await recalcOrderTotal(tx, orderId);
      return updated;
    });
  },

  async removeItem(orderId: string, itemId: string) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== "draft") throw new AppError("Can only remove items from draft orders", 400);

    return db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(orderItems)
        .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)))
        .returning({ id: orderItems.id });

      if (!deleted) throw new AppError("Order item not found", 404);
      await recalcOrderTotal(tx, orderId);
    });
  },
};
