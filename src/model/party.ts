import { eq } from 'drizzle-orm'
import { db } from '../drizzle/db'

import { Party as Parties, parties } from '../drizzle/schema'
import { PartyInput } from '../validators/validatorSchema'



export const Model =
{
  async getAll(): Promise<Parties[]> {
    return await db.query.parties.findMany({
      with: {
        group: true,
        transport: true
      }
    })
  },

  async getByID(id: string): Promise<Parties | null> {
    const result = await db.select().from(parties).where(eq(parties.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Parties | null> {
    const result = await db.delete(parties).where(eq(parties.id, id)).returning()
    return result[0] || null
  },
  async create(data: PartyInput): Promise<Parties> {
    const result = await db.insert(parties).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<PartyInput>): Promise<Parties> {
    const result = await db.update(parties).set(data).where(eq(parties.id, id)).returning()
    return result[0]
  }

}



