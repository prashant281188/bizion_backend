import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { units } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateUnitInput, ListUnitInput, UpdateUnitInput } from "./unit.schema";

export const unitService = {
  async list({ page = 1, limit = 10, search }: ListUnitInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(units.unitName, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(units).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(units).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const unit = await db.query.units.findFirst({ where: eq(units.id, id) });
    if (!unit) throw new AppError("Unit not found", 404);
    return unit;
  },

  async create(data: CreateUnitInput) {
    const existing = await db.query.units.findFirst({ where: eq(units.unitName, data.unitName) });
    if (existing) throw new AppError("Unit name already exists", 409);

    const [unit] = await db.insert(units).values(data).returning();
    return unit;
  },

  async update(id: string, data: UpdateUnitInput) {
    const [updated] = await db.update(units).set(data).where(eq(units.id, id)).returning();
    if (!updated) throw new AppError("Unit not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(units).where(eq(units.id, id)).returning({ id: units.id });
    if (!deleted) throw new AppError("Unit not found", 404);
  },
};
