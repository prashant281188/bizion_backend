
import { ilike, sql, eq } from "drizzle-orm";
import { categories } from "../../db/schema";
import { db } from "../../config/db";

export const categoryService = {
  async list({ page = 1, limit = 10, search = "" }) {
    const offset = (page - 1) * limit;

    const where = search
      ? ilike(categories.categoryName, `%${search}%`)
      : undefined;

    const items = await db
      .select()
      .from(categories)
      .where(where)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(where);

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

  async create(data: { categoryName: string; parentId?: string }) {
    const [row] = await db
      .insert(categories)
      .values({
        categoryName: data.categoryName,
        parentId: data.parentId
      })
      .returning();

    return row;
  },

  async update(id: string, data: any) {
    const [row] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();

    return row ?? null;
  },

  async remove(id: string) {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));

    return result;
  },
};
