import { eq } from 'drizzle-orm'



import { categories, Category } from '../schema/schema'
import { CategoryInput } from '../validators/validatorSchema'
import { db } from '../db/db'



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

  async create(data: CategoryInput): Promise<Category> {
    const result = await db.insert(categories).values(data).returning()
    return result[0]

  },

  async update(id: string, data: CategoryInput) {
    const result = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
    return result[0]
  }

}



