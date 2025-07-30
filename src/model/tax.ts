import { eq } from 'drizzle-orm'
import { db } from '../drizzle/db'

import { Tax, taxes } from '../drizzle/schema'
import { TaxInput } from '../validators/validatorSchema'



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
  async create(data: TaxInput): Promise<Tax> {
    const result = await db.insert(taxes).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<TaxInput>): Promise<Tax> {
    const result = await db.update(taxes).set(data).where(eq(taxes.id, id)).returning()
    return result[0]
  }

}



