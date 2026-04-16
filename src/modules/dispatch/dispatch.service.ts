import { asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { dispatches, dispatchItems, dispatchAllocations, orderItems } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateDispatchInput, ListDispatchInput, UpdateDispatchInput } from "./dispatch.schema";

export const dispatchService = {
  async list({ page, limit, search }: ListDispatchInput) {
    const where = search
      ? or(ilike(dispatches.dispatchNumber, `%${search}%`), ilike(dispatches.transport, `%${search}%`))
      : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.dispatches.findMany({
        where,
        limit: limit,
        offset: limit !== undefined ? ((page ?? 1) - 1) * limit : undefined,
        orderBy: [asc(dispatches.createdAt)],
        with: {
          createdByUser: { columns: { id: true, firstName: true, lastName: true } },
          items: true,
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(dispatches).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: { page: resolvedPage, limit: resolvedLimit, total, totalPages: limit ? Math.ceil(total / limit) : 1 },
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
        .values({
          dispatchNumber: data.dispatchNumber,
          dispatchedAt: data.dispatchedAt,
          notes: data.notes,
          nop: data.nop,
          transport: data.transport,
          createdBy,
          updatedAt: new Date(),
        })
        .returning();

      for (const item of data.items) {
        const [dispatchItem] = await tx
          .insert(dispatchItems)
          .values({
            dispatchId: dispatch.id,
            variantId: item.variantId,
            totalQty: item.totalQty,
          })
          .returning();

        await tx.insert(dispatchAllocations).values(
          item.allocations.map((a) => ({
            dispatchItemId: dispatchItem.id,
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

      return dispatch;
    });
  },

  async update(id: string, data: UpdateDispatchInput) {
    return db.transaction(async (tx) => {
      const [dispatch] = await tx
        .update(dispatches)
        .set({
          dispatchNumber: data.dispatchNumber,
          dispatchedAt: data.dispatchedAt,
          notes: data.notes,
          nop: data.nop,
          transport: data.transport,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(dispatches.id, id))
        .returning();

      if (!dispatch) throw new AppError("Dispatch not found", 404);

      const existingItems = await tx
        .select()
        .from(dispatchItems)
        .where(eq(dispatchItems.dispatchId, id));

      const incomingItemIds = new Set((data.items ?? []).filter((i) => i.id).map((i) => i.id!));
      const itemsToDelete = existingItems.filter((ei) => !incomingItemIds.has(ei.id));

      for (const item of itemsToDelete) {
        const allocations = await tx
          .select()
          .from(dispatchAllocations)
          .where(eq(dispatchAllocations.dispatchItemId, item.id));

        for (const a of allocations) {
          await tx
            .update(orderItems)
            .set({ fulfilledQty: sql`coalesce(${orderItems.fulfilledQty}, 0) - ${a.allocatedQty}` })
            .where(eq(orderItems.id, a.orderItemId));
        }

        await tx.delete(dispatchItems).where(eq(dispatchItems.id, item.id));
      }

      for (const item of (data.items ?? [])) {
        let dispatchItemId: string;

        if (item.id) {
          const [updated] = await tx
            .update(dispatchItems)
            .set({ variantId: item.variantId, totalQty: item.totalQty })
            .where(eq(dispatchItems.id, item.id))
            .returning();
          dispatchItemId = updated.id;

          // Reverse old allocations before replacing
          const oldAllocations = await tx
            .select()
            .from(dispatchAllocations)
            .where(eq(dispatchAllocations.dispatchItemId, dispatchItemId));

          for (const a of oldAllocations) {
            await tx
              .update(orderItems)
              .set({ fulfilledQty: sql`coalesce(${orderItems.fulfilledQty}, 0) - ${a.allocatedQty}` })
              .where(eq(orderItems.id, a.orderItemId));
          }

          await tx
            .delete(dispatchAllocations)
            .where(eq(dispatchAllocations.dispatchItemId, dispatchItemId));
        } else {
          const [inserted] = await tx
            .insert(dispatchItems)
            .values({
              dispatchId: dispatch.id,
              variantId: item.variantId,
              totalQty: item.totalQty,
            })
            .returning();
          dispatchItemId = inserted.id;
        }

        await tx.insert(dispatchAllocations).values(
          item.allocations.map((a) => ({
            dispatchItemId,
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

      return dispatch;
    });
  },

  async remove(id: string) {
    return db.transaction(async (tx) => {
      const existing = await tx.query.dispatches.findFirst({
        where: eq(dispatches.id, id),
        with: { items: { with: { allocations: true } } },
      });
      if (!existing) throw new AppError("Dispatch not found", 404);

      // Reverse fulfilledQty for all allocations before cascade delete
      for (const item of existing.items) {
        for (const a of item.allocations) {
          await tx
            .update(orderItems)
            .set({ fulfilledQty: sql`coalesce(${orderItems.fulfilledQty}, 0) - ${a.allocatedQty}` })
            .where(eq(orderItems.id, a.orderItemId));
        }
      }

      const [deleted] = await tx
        .delete(dispatches)
        .where(eq(dispatches.id, id))
        .returning({ id: dispatches.id });

      return deleted;
    });
  },
};
