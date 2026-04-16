import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { brands } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateBrandInput, ListBrandInput, UpdateBrandInput } from "./brand.schema";
import { createSlug } from "../../utils/slug";

export const brandService = {
  async list({ page, limit, search }: ListBrandInput) {
    const where = search ? ilike(brands.brandName, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? db.select().from(brands).where(where).limit(limit).offset(((page ?? 1) - 1) * limit)
        : db.select().from(brands).where(where),
      db.select({ count: sql<number>`count(*)` }).from(brands).where(where),
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
    const brand = await db.query.brands.findFirst({ where: eq(brands.id, id) });
    if (!brand) throw new AppError("Brand not found", 404);
    return brand;
  },

  async create(data: CreateBrandInput) {
    const existing = await db.query.brands.findFirst({
      where: eq(brands.brandName, data.brandName),
    });
    if (existing) throw new AppError("Brand name already exists", 409);
    const slug = createSlug(data.brandName)
    const [brand] = await db.insert(brands).values({ slug, ...data }).returning();
    return brand;
  },

  async update(id: string, data: UpdateBrandInput) {
    const slug = createSlug(data.brandName)
    const [updated] = await db.update(brands).set({ slug, ...data }).where(eq(brands.id, id)).returning();
    if (!updated) throw new AppError("Brand not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(brands).where(eq(brands.id, id)).returning({ id: brands.id });
    if (!deleted) throw new AppError("Brand not found", 404);
  },
};
