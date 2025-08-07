import { db } from '../db/db'
import { HSN, hsns, HSNUpdate } from '../schema/schema'
import { eq } from 'drizzle-orm'

export const Model =
{
  async getAll(): Promise<HSN[]> {
    return await db.select().from(hsns)
  },

  async getByID(id: string): Promise<HSN | null> {
    const result = await db.select().from(hsns).where(eq(hsns.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<HSN | null> {
    const result = await db.delete(hsns).where(eq(hsns.id, id)).returning()
    return result[0] || null
  },

  async create(data: HSN): Promise<HSN> {
    const result = await db.insert(hsns).values(data).returning()
    return result[0]
  },

  async update(data: HSNUpdate): Promise<HSN> {
    const result = await db.update(hsns).set(data).where(eq(hsns.id, data.id)).returning()
    return result[0]
  }

}



