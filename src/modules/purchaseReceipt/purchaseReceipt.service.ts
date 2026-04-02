import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { purchaseReceipts, purchaseReceiptItems, purchaseReceiptAllocations, orderItems } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreatePurchaseReceiptInput, ListPurchaseReceiptInput } from "./purchaseReceipt.schema";

export const purchaseReceiptService = {
  async list({ page = 1, limit = 20, orderId }: ListPurchaseReceiptInput) {
    const offset = (page - 1) * limit;
    const where = orderId ? eq(purchaseReceipts.orderId, orderId) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.purchaseReceipts.findMany({
        where,
        limit,
        offset,
        orderBy: [asc(purchaseReceipts.createdAt)],
        with: {
          order: { columns: { id: true, orderNumber: true, orderType: true } },
          createdByUser: { columns: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(purchaseReceipts).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const receipt = await db.query.purchaseReceipts.findFirst({
      where: eq(purchaseReceipts.id, id),
      with: {
        order: { columns: { id: true, orderNumber: true, orderType: true } },
        createdByUser: { columns: { id: true, firstName: true, lastName: true } },
        items: {
          with: { allocations: true },
        },
      },
    });
    if (!receipt) throw new AppError("Purchase receipt not found", 404);
    return receipt;
  },

  async create(data: CreatePurchaseReceiptInput, createdBy: string) {
    return db.transaction(async (tx) => {
      const [receipt] = await tx
        .insert(purchaseReceipts)
        .values({
          orderId: data.orderId,
          receivedDate: data.receivedDate,
          createdBy,
          updatedAt: new Date(),
        })
        .returning();

      for (const item of data.items) {
        const [receiptItem] = await tx
          .insert(purchaseReceiptItems)
          .values({
            receipt_id: receipt.id,
            variant_id: item.variantId,
            orderId: item.orderId,
            totalQty: item.totalQty,
          })
          .returning();

        if (item.allocations?.length) {
          await tx.insert(purchaseReceiptAllocations).values(
            item.allocations.map((a) => ({
              receiptItemId: receiptItem.id,
              orderItemId: a.orderItemId,
              allocatedQty: a.allocatedQty,
            }))
          );

          for (const a of item.allocations) {
            await tx
              .update(orderItems)
              .set({ fulfilledQty: sql`coalesce(${orderItems.fulfilledQty}, 0) + ${a.allocatedQty}` })
              .where(eq(orderItems.id, a.orderItemId));
          }
        }
      }

      return receipt;
    });
  },

  async remove(id: string) {
    const existing = await db.query.purchaseReceipts.findFirst({ where: eq(purchaseReceipts.id, id) });
    if (!existing) throw new AppError("Purchase receipt not found", 404);

    const [deleted] = await db
      .delete(purchaseReceipts)
      .where(eq(purchaseReceipts.id, id))
      .returning({ id: purchaseReceipts.id });

    return deleted;
  },
};
