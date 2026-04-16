import { and, eq, ilike, sql } from "drizzle-orm";
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

  async list({ page, limit, search }: ListOptionInput) {
    const where = search ? ilike(options.optionName, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.options.findMany({
        where,
        limit: limit,
        offset: limit !== undefined ? ((page ?? 1) - 1) * limit : undefined,
        with: { values: { orderBy: (v, { asc }) => [asc(v.position)] } },
      }),
      db.select({ count: sql<number>`count(*)` }).from(options).where(where),
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
    return deleted;
  },

  /* ===== OPTION VALUES ===== */

  async addValue(optionId: string, data: CreateOptionValueInput) {
    const option = await db.query.options.findFirst({ where: eq(options.id, optionId) });
    if (!option) throw new AppError("Option not found", 404);

    const existing = await db.query.optionValues.findFirst({
      where: and(eq(optionValues.optionId, optionId), eq(optionValues.optionValue, data.optionValue)),
    });
    if (existing) throw new AppError("Option value already exists for this option", 409);

    if (parseInt(data.optionValue))
      data.position = Number(data.optionValue.trim())
    const [value] = await db.insert(optionValues).values({ ...data, optionId }).returning();
    return value;
  },

  async updateValue(optionId: string, valueId: string, data: UpdateOptionValueInput) {
    const existing = await db.query.optionValues.findFirst({
      where: and(eq(optionValues.id, valueId), eq(optionValues.optionId, optionId)),
    });
    if (!existing) throw new AppError("Option value not found", 404);

    const [updated] = await db
      .update(optionValues)
      .set(data)
      .where(eq(optionValues.id, valueId))
      .returning();

    return updated;
  },

  async removeValue(optionId: string, valueId: string) {
    const existing = await db.query.optionValues.findFirst({
      where: and(eq(optionValues.id, valueId), eq(optionValues.optionId, optionId)),
    });
    if (!existing) throw new AppError("Option value not found", 404);

    const [deleted] = await db
      .delete(optionValues)
      .where(eq(optionValues.id, valueId))
      .returning({ id: optionValues.id });

    return deleted;
  },
};
