import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../../config/db";
import { gstGroups } from "../../../db/schema";
import { AppError } from "../../../middlewares/errorHandler";
import { CreateGstGroupInput, ListGstGroupInput, UpdateGstGroupInput } from "./gstGroup.schema";

export const gstGroupService = {
  async list({ page = 1, limit = 10, search }: ListGstGroupInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(gstGroups.name, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.gstGroups.findMany({
        where,
        limit,
        offset,
        with: { rates: true },
      }),
      db.select({ count: sql<number>`count(*)` }).from(gstGroups).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
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
