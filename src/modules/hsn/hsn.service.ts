import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { hsnCodes } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateHsnInput, ListHsnInput, UpdateHsnInput } from "./hsn.schema";

export const hsnService = {
  async list({ page = 1, limit = 10, search }: ListHsnInput) {
    const offset = (page - 1) * limit;

    const activeFilter = eq(hsnCodes.isActive, true);
    const where = search
      ? and(activeFilter, ilike(hsnCodes.hsnCode, `%${search}%`))
      : activeFilter;

    const [items, [{ count }]] = await Promise.all([
      db.query.hsnCodes.findMany({
        where,
        limit,
        offset,
        with: { gstHistory: true },
      }),
      db.select({ count: sql<number>`count(*)` }).from(hsnCodes).where(where),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  },

  async getById(id: string) {
    const hsn = await db.query.hsnCodes.findFirst({
      where: eq(hsnCodes.id, id),
      with: { gstHistory: true },
    });

    if (!hsn) throw new AppError("HSN not found", 404);

    return hsn;
  },

  async create(data: CreateHsnInput) {
    const existing = await db.query.hsnCodes.findFirst({
      where: eq(hsnCodes.hsnCode, data.hsnCode),
    });

    if (existing) throw new AppError("HSN code already exists", 409);

    const [hsn] = await db.insert(hsnCodes).values(data).returning();

    return hsn;
  },

  async update(id: string, data: UpdateHsnInput) {
    const [updated] = await db
      .update(hsnCodes)
      .set(data)
      .where(eq(hsnCodes.id, id))
      .returning();

    if (!updated) throw new AppError("HSN not found", 404);

    return updated;
  },

  async remove(id: string) {
    const [updated] = await db
      .update(hsnCodes)
      .set({ isActive: false })
      .where(eq(hsnCodes.id, id))
      .returning({ id: hsnCodes.id });

    if (!updated) throw new AppError("HSN not found", 404);

    return { message: "HSN deactivated successfully" };
  },
};
