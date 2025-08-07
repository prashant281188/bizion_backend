import { eq } from 'drizzle-orm'
import { db } from '../db/db'


import { units, Unit } from '../schema/schema'
import { UnitInput } from '../validators/validatorSchema'



export const Model =
{
  async getAll(): Promise<Unit[]> {
    return await db.select().from(units)
  },
  
  async getByID(id: string): Promise<Unit | null> {
    const result = await db.select().from(units).where(eq(units.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Unit | null> {
    const result = await db.delete(units).where(eq(units.id, id)).returning()
    return result[0] || null
  },

  async create(data: UnitInput): Promise<Unit> {
    const result = await db.insert(units).values(data).returning()
    return result[0]

  },

  async update(id: string, data: UnitInput) {
    const result = await db.update(units).set(data).where(eq(units.id, id)).returning()
    return result[0]
  }

}



