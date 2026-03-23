import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { brands } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateBrandInput, ListBrandInput, UpdateBrandInput } from "./brand.schema";

export const brandService = {
  async list({ page = 1, limit = 10, search }: ListBrandInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(brands.brandName, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(brands).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(brands).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.id, id) });
    if (!brand) throw new AppError("Brand not found", 404);
    return brand;
  },

  async create(data: CreateBrandInput) {
    const existing = await db.query.brands.findFirst({
      where: eq(brands.brandName, data.brandName),
    });
    if (existing) throw new AppError("Brand name already exists", 409);

    const [brand] = await db.insert(brands).values(data).returning();
    return brand;
  },

  async update(id: string, data: UpdateBrandInput) {
    const [updated] = await db.update(brands).set(data).where(eq(brands.id, id)).returning();
    if (!updated) throw new AppError("Brand not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(brands).where(eq(brands.id, id)).returning({ id: brands.id });
    if (!deleted) throw new AppError("Brand not found", 404);
  },
};
