import { db } from '../db/db'
import { categories, Category, CategoryUpdate } from '../schema/schema'
import { eq } from 'drizzle-orm'


export const Model =
{
  async getAll(): Promise<Category[]> {
    return await db.select().from(categories)
  },

  async getByID(id: string): Promise<Category | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Category | null> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning()
    return result[0] || null
  },

  async create(data: Category): Promise<Category | null> {
    const existing = db.query.categories.findFirst({
      where: (eq(categories.categoryName, data.categoryName))
    })
    if (!existing) {
      const result = await db.insert(categories).values(data).returning()
      return result[0]
    }
    return null

  },

  async update(data: CategoryUpdate): Promise<Category> {
    const result = await db.update(categories).set(data).where(eq(categories.id, data.id)).returning()
    return result[0]
  },

  async patch(data: Partial<CategoryUpdate>): Promise<Category> {
    const result = await db.update(categories).set(data).where(eq(categories.id, data.id!)).returning()
    return result[0]
  }
}



