import { eq } from 'drizzle-orm'
import { db } from '../drizzle/db'

import { HSN, hsns } from '../drizzle/schema'
import { HSNInput } from '../validators/validatorSchema'



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
  async create(data: HSNInput): Promise<HSN> {
    const result = await db.insert(hsns).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<HSNInput>): Promise<HSN> {
    const result = await db.update(hsns).set(data).where(eq(hsns.id, id)).returning()
    return result[0]
  }

}



