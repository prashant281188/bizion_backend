import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { gstGroups } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateGstGroupInput, ListGstGroupInput, UpdateGstGroupInput } from "./gstGroup.schema";

export const gstGroupService = {
  async list({ page, limit, search }: ListGstGroupInput) {
    const where = search ? ilike(gstGroups.name, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.gstGroups.findMany({
        where,
        limit: limit,
        offset: limit !== undefined ? ((page ?? 1) - 1) * limit : undefined,
        with: { rates: true },
      }),
      db.select({ count: sql<number>`count(*)` }).from(gstGroups).where(where),
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
    const group = await db.query.gstGroups.findFirst({
      where: eq(gstGroups.id, id),
      with: { rates: true },
    });
    if (!group) throw new AppError("GST group not found", 404);
    return group;
  },

  async create(data: CreateGstGroupInput) {
    const existing = await db.query.gstGroups.findFirst({ where: eq(gstGroups.name, data.name) });
    if (existing) throw new AppError("GST group name already exists", 409);

    const [group] = await db.insert(gstGroups).values(data).returning();
    return group;
  },

  async update(id: string, data: UpdateGstGroupInput) {
    const [updated] = await db.update(gstGroups).set(data).where(eq(gstGroups.id, id)).returning();
    if (!updated) throw new AppError("GST group not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(gstGroups).where(eq(gstGroups.id, id)).returning({ id: gstGroups.id });
    if (!deleted) throw new AppError("GST group not found", 404);
    return deleted;
  },
};
