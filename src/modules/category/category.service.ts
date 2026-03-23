import { and, eq, ilike, sql } from "drizzle-orm";
import { categories } from "../../db/schema";
import { db } from "../../config/db";
import { AppError } from "../../middlewares/errorHandler";
import {
  CreateCategoryInput,
  ListCategoryInput,
  UpdateCategoryInput,
} from "./category.schema";

export const categoryService = {
  async list({ page = 1, limit = 10, search }: ListCategoryInput) {
    const offset = (page - 1) * limit;

    const where = search
      ? ilike(categories.categoryName, `%${search}%`)
      : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(categories).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(categories).where(where),
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
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  },

  async create(data: CreateCategoryInput) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.categoryName, data.categoryName),
    });

    if (existing) throw new AppError("Category name already exists", 409);

    const [row] = await db.insert(categories).values(data).returning();

    return row;
  },

  async update(id: string, data: UpdateCategoryInput) {
    const [row] = await db
      .update(categories)
      .set(data)
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
