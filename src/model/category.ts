
import { db } from '../db/db'
import { categories, Category, CategoryRecord, CategoryUpdate } from '../schema/schema'
import { and, asc, count, desc, eq, ilike, sql } from 'drizzle-orm'


export const categoryModel =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;

  }): Promise<CategoryRecord[]> {
    const conditions = [];
    if (filters.search) {
      conditions.push(ilike(categories.categoryName, `%${filters.search.trim()}%`))
    }

    return await db.query.categories.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit,
    })
  },



  async count({ filters }: { filters: { search?: string; status?: string; createdFrom?: Date; createdTo?: Date } }) {
    const conditions = [];

    if (filters.search) {
      conditions.push(ilike(categories.categoryName, `%${filters.search.trim()}%`));
    }

    const result = await db
      .select({ count: count() })
      .from(categories)
      .where(conditions.length ? and(...conditions) : undefined);

    return Number(result[0]?.count ?? 0);
  },

  async getByName(name: string): Promise<CategoryRecord | undefined> {
    return db.query.categories.findFirst({
      where: eq(categories.categoryName, name.trim().toLowerCase()),
    });
  },

  async getByID(id: string): Promise<CategoryRecord | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<CategoryRecord | null> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning()
    return result[0] || null
  },

  async create(data: Category): Promise<CategoryRecord | null> {

    const result = await db.insert(categories).values(
      { categoryName: data.categoryName.toLowerCase().trim(), categoryDescription: data.categoryDescription?.toLowerCase() }).returning()
    return result[0]

  },

  async update(data: CategoryUpdate): Promise<CategoryRecord> {
    const result = await db.update(categories).set(data).where(eq(categories.id, data.id)).returning()
    return result[0]
  },

  async patch(data: Partial<CategoryUpdate>): Promise<CategoryRecord> {
    const result = await db.update(categories).set(data).where(eq(categories.id, data.id!)).returning()
    return result[0]
  }
}



