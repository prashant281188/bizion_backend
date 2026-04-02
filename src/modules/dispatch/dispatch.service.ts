import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { dispatches, dispatchItems, dispatchAllocations, orderItems } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateDispatchInput, ListDispatchInput } from "./dispatch.schema";

export const dispatchService = {
  async list({ page = 1, limit = 20 }: ListDispatchInput) {
    const offset = (page - 1) * limit;

    const [items, [{ count }]] = await Promise.all([
      db.query.dispatches.findMany({
        limit,
        offset,
        orderBy: [asc(dispatches.createdAt)],
        with: {
          createdByUser: { columns: { id: true, firstName: true, lastName: true } },
          items: true,
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(dispatches),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const dispatch = await db.query.dispatches.findFirst({
      where: eq(dispatches.id, id),
      with: {
        createdByUser: { columns: { id: true, firstName: true, lastName: true } },
        items: {
          with: { allocations: true },
        },
      },
    });
    if (!dispatch) throw new AppError("Dispatch not found", 404);
    return dispatch;
  },

  async create(data: CreateDispatchInput, createdBy: string) {
    return db.transaction(async (tx) => {
      const [dispatch] = await tx
        .insert(dispatches)
        .values({ dispatchNumber: data.dispatchNumber, createdBy, updatedAt: new Date() })
        .returning();

      for (const item of data.items) {
        const [dispatchItem] = await tx
          .insert(dispatchItems)
          .values({
            dispatchId: dispatch.id,
            orderItemId: item.orderItemId,
            variantId: item.variantId,
            totalQty: item.totalQty,
          })
          .returning();

        if (item.allocations?.length) {
          await tx.insert(dispatchAllocations).values(
            item.allocations.map((a) => ({
              dispatchItemId: dispatchItem.id,
              fieldOrderItemId: a.fieldOrderItemId,
              allocatedQty: a.allocatedQty,
            }))
          );

          for (const a of item.allocations) {
            await tx
              .update(orderItems)
              .set({ fulfilledQty: sql`coalesce(${orderItems.fulfilledQty}, 0) + ${a.allocatedQty}` })
              .where(eq(orderItems.id, a.fieldOrderItemId));
          }
        }
      }

      return dispatch;
    });
  },

  async remove(id: string) {
    const existing = await db.query.dispatches.findFirst({ where: eq(dispatches.id, id) });
    if (!existing) throw new AppError("Dispatch not found", 404);

    const [deleted] = await db
      .delete(dispatches)
      .where(eq(dispatches.id, id))
      .returning({ id: dispatches.id });

    return deleted;
  },
};
