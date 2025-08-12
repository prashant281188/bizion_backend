import { eq, ilike, and, count } from 'drizzle-orm'
import { db } from '../db/db'

import { Party, parties, PartyUpdate, PartyRecord } from '../schema/schema'



export const Model =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;
  }): Promise<PartyRecord[]> {

    const conditions = []

    if (filters.search)
      conditions.push(ilike(parties.name, `%${filters.search.trim()}%`))

    return await db.query.parties.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search: string } }) {
    const conditions = []

    if (filters.search)
      conditions.push(ilike(parties.name, `%${filters.search.trim()}%`))

    const result = await db.select({ count: count() }).from(parties).where(
      conditions.length ? and(...conditions) : undefined
    )

    return Number(result[0]?.count ?? 0)
  },

  async getByName(gstin: string): Promise<PartyRecord | null> {
    return await db.query.parties.findFirst({
      where: (eq(parties.gstin, gstin))
    }) || null
  },

  async getByID(id: string): Promise<PartyRecord | null> {
    const result = await db.select().from(parties).where(eq(parties.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<PartyRecord | null> {
    const result = await db.delete(parties).where(eq(parties.id, id)).returning()
    return result[0] || null
  },

  async create(data: Party): Promise<PartyRecord> {
    const result = await db.insert(parties).values(data).returning()
    return result[0]
  },

  async update(data: PartyUpdate): Promise<PartyRecord> {
    const result = await db.update(parties).set(data).where(eq(parties.id, data.id)).returning()
    return result[0]
  }

}


