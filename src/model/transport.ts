import { eq } from 'drizzle-orm'
import { db } from '../db/db'
import { Transport, transports, TrasnportUpdate } from '../schema/transport'

export const Model =
{
  async getAll(): Promise<Transport[]> {
    return await db.select().from(transports)
  },

  async getByID(id: string): Promise<Transport | null> {
    const result = await db.query.transports.findFirst({
      where: (eq(transports.id, id))
    })
    return result || null
  },

  async delete(id: string): Promise<Transport | null> {
    const result = await db.delete(transports).where(eq(transports.id, id)).returning()
    return result[0] || null
  },
  async create(data: Transport): Promise<Transport> {
    const result = await db.insert(transports).values(data).returning()
    return result[0]
  },

  async update(data: TrasnportUpdate): Promise<Transport> {
    const result = await db.update(transports).set(data).where(eq(transports.id, data.id)).returning()
    return result[0]
  }

}



