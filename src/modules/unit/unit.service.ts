import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { units } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateUnitInput, ListUnitInput, UpdateUnitInput } from "./unit.schema";

export const unitService = {
  async list({ page, limit, search }: ListUnitInput) {
    const where = search
      ? or(ilike(units.unitName, `%${search}%`), ilike(units.unitSymbol, `%${search}%`))
      : undefined;

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? db.select().from(units).where(where).limit(limit).offset(((page ?? 1) - 1) * limit)
        : db.select().from(units).where(where),
      db.select({ count: sql<number>`count(*)` }).from(units).where(where),
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
    const unit = await db.query.units.findFirst({ where: eq(units.id, id) });
    if (!unit) throw new AppError("Unit not found", 404);
    return unit;
  },

  async create(data: CreateUnitInput) {
    const conditions = [eq(units.unitName, data.unitName)];
    if (data.unitSymbol) conditions.push(eq(units.unitSymbol, data.unitSymbol));

    const existing = await db.query.units.findFirst({ where: or(...conditions) });
    if (existing) {
      if (existing.unitName === data.unitName) throw new AppError("Unit name already exists", 409);
      throw new AppError("Unit symbol already exists", 409);
    }

    const [unit] = await db.insert(units).values(data).returning();
    return unit;
  },

  async update(id: string, data: UpdateUnitInput) {
    const existing = await db.query.units.findFirst({ where: eq(units.id, id) });
    if (!existing) throw new AppError("Unit not found", 404);

    const conditions = [];
    if (data.unitName) conditions.push(eq(units.unitName, data.unitName));
    if (data.unitSymbol) conditions.push(eq(units.unitSymbol, data.unitSymbol));

    if (conditions.length) {
      const conflict = await db.query.units.findFirst({
        where: and(or(...conditions), ne(units.id, id)),
      });
      if (conflict) {
        if (data.unitName && conflict.unitName === data.unitName)
          throw new AppError("Unit name already exists", 409);
        throw new AppError("Unit symbol already exists", 409);
      }
    }

    const [updated] = await db.update(units).set(data).where(eq(units.id, id)).returning();
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(units).where(eq(units.id, id)).returning({ id: units.id });
    if (!deleted) throw new AppError("Unit not found", 404);
    return deleted;
  },
};
