import { eq } from 'drizzle-orm'
import { db } from '../db/db'

import { Transport, transports } from '../schema/schema'
import { TransportInput } from '../validators/validatorSchema'



export const Model =
{
  async getAll(): Promise<Transport[]> {
    return await db.query.transports.findMany()
  },

  async getByID(id: string): Promise<Transport | null> {
    const result = await db.select().from(transports).where(eq(transports.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Transport | null> {
    const result = await db.delete(transports).where(eq(transports.id, id)).returning()
    return result[0] || null
  },
  async create(data: TransportInput): Promise<Transport> {
    const result = await db.insert(transports).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<TransportInput>): Promise<Transport> {
    const result = await db.update(transports).set(data).where(eq(transports.id, id)).returning()
    return result[0]
  }

}



