import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { categories } from "../../db/schema";
import { db } from "../../config/db";
import { AppError } from "../../middlewares/errorHandler";
import {
  CreateCategoryInput,
  ListCategoryInput,
  UpdateCategoryInput,
} from "./category.schema";
import { createSlug } from "../../utils/slug";

export const categoryService = {
  async list({ page, limit, search }: ListCategoryInput) {
    const where = search
      ? ilike(categories.categoryName, `%${search}%`)
      : undefined;

    const baseQuery = db.select().from(categories).where(where).orderBy(asc(categories.categoryName));

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? baseQuery.limit(limit).offset(((page ?? 1) - 1) * limit)
        : baseQuery,
      db.select({ count: sql<number>`count(*)` }).from(categories).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: {
        page: resolvedPage,
        limit: resolvedLimit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    };
  },

  async getById(id: string) {
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  },

  async create(data: CreateCategoryInput) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.categoryName, data.categoryName),
    });

    if (existing) throw new AppError("Category name already exists", 409);

    const slug = createSlug(data.categoryName);
    const [row] = await db.insert(categories).values({ slug, ...data }).returning();

    return row;
  },

  async update(id: string, data: UpdateCategoryInput) {

    const [row] = await db
      .update(categories)
      .set({ ...data })
      .where(eq(categories.id, id))
      .returning();

    return row ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    return deleted ?? null;
  },
};
