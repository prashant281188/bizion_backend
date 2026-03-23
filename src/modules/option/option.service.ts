import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { options, optionValues } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import {
  CreateOptionInput,
  CreateOptionValueInput,
  ListOptionInput,
  UpdateOptionInput,
  UpdateOptionValueInput,
} from "./option.schema";

export const optionService = {
  /* ===== OPTIONS ===== */

  async list({ page = 1, limit = 10, search }: ListOptionInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(options.optionName, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.options.findMany({
        where,
        limit,
        offset,
        with: { values: { orderBy: (v, { asc }) => [asc(v.position)] } },
      }),
      db.select({ count: sql<number>`count(*)` }).from(options).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const option = await db.query.options.findFirst({
      where: eq(options.id, id),
      with: { values: { orderBy: (v, { asc }) => [asc(v.position)] } },
    });
    if (!option) throw new AppError("Option not found", 404);
    return option;
  },

  async create(data: CreateOptionInput) {
    const existing = await db.query.options.findFirst({
      where: eq(options.optionName, data.optionName),
    });
    if (existing) throw new AppError("Option name already exists", 409);

    const [option] = await db.insert(options).values(data).returning();
    return option;
  },

  async update(id: string, data: UpdateOptionInput) {
    const [updated] = await db.update(options).set(data).where(eq(options.id, id)).returning();
    if (!updated) throw new AppError("Option not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(options).where(eq(options.id, id)).returning({ id: options.id });
    if (!deleted) throw new AppError("Option not found", 404);
  },

  /* ===== OPTION VALUES ===== */

  async addValue(optionId: string, data: CreateOptionValueInput) {
    const option = await db.query.options.findFirst({ where: eq(options.id, optionId) });
    if (!option) throw new AppError("Option not found", 404);

    const [value] = await db.insert(optionValues).values({ ...data, optionId }).returning();
    return value;
  },

  async updateValue(optionId: string, valueId: string, data: UpdateOptionValueInput) {
    const [updated] = await db
      .update(optionValues)
      .set(data)
      .where(eq(optionValues.id, valueId))
      .returning();

    if (!updated || updated.optionId !== optionId) throw new AppError("Option value not found", 404);
    return updated;
  },

  async removeValue(optionId: string, valueId: string) {
    const [deleted] = await db
      .delete(optionValues)
      .where(eq(optionValues.id, valueId))
      .returning({ id: optionValues.id, optionId: optionValues.optionId });

    if (!deleted || deleted.optionId !== optionId) throw new AppError("Option value not found", 404);
  },
};
