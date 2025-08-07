import { eq } from 'drizzle-orm'
import { db } from '../db/db'

import { Tax, taxes, TaxUpdate } from '../schema/schema'



export const Model =
{
  async getAll(): Promise<Tax[]> {
    return await db.select().from(taxes)
  },

  async getByID(id: string): Promise<Tax | null> {
    const result = await db.select().from(taxes).where(eq(taxes.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Tax | null> {
    const result = await db.delete(taxes).where(eq(taxes.id, id)).returning()
    return result[0] || null
  },
  async create(data: Tax): Promise<Tax> {
    const result = await db.insert(taxes).values(data).returning()
    return result[0]
  },

  async update(data: TaxUpdate): Promise<Tax> {
    const result = await db.update(taxes).set(data).where(eq(taxes.id, data.id)).returning()
    return result[0]
  }

}



