import { eq } from 'drizzle-orm'
import { db } from '../db/db'

import { Party, parties, PartyUpdate } from '../schema/schema'



export const Model =
{
  async getAll(): Promise<Party[]> {
    return await db.query.parties.findMany({
      with: {
        group: true,
        transport: true
      }
    })
  },

  async getByID(id: string): Promise<Party | null> {
    const result = await db.select().from(parties).where(eq(parties.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Party | null> {
    const result = await db.delete(parties).where(eq(parties.id, id)).returning()
    return result[0] || null
  },
  async create(data: Party): Promise<Party> {
    console.log(data, "is being created")
    const result = await db.insert(parties).values(data).returning();
    return result[0]
  },

  async update(id: string, data: PartyUpdate): Promise<Party> {
    const result = await db.update(parties).set(data).where(eq(parties.id, id)).returning()
    return result[0]
  }

}



