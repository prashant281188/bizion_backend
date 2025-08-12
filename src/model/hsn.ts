import { db } from '../db/db'
import { HSN, HsnRecord, hsns, HSNUpdate } from '../schema/schema'
import { and, count, eq, ilike } from 'drizzle-orm'

export const hsnModel =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;
  }): Promise<HsnRecord[]> {

    const conditions = []

    if (filters.search)
      conditions.push(ilike(hsns.hsnCode, `%${filters.search.trim()}%`))

    return await db.query.hsns.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search: string } }) {
    const conditions = []

    if (filters.search)
      conditions.push(ilike(hsns.hsnCode, `%${filters.search.trim()}%`))

    const result = await db.select({ count: count() }).from(hsns).where(
      conditions.length ? and(...conditions) : undefined
    )

    return Number(result[0]?.count ?? 0)
  },

  async getByCode(code: number): Promise<HsnRecord | null> {
    return await db.query.hsns.findFirst({
      where: (eq(hsns.hsnCode, code))
    }) || null
  },

  async getByID(id: string): Promise<HsnRecord | null> {
    const result = await db.select().from(hsns).where(eq(hsns.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<HsnRecord | null> {
    const result = await db.delete(hsns).where(eq(hsns.id, id)).returning()
    return result[0] || null
  },

  async create(data: HSN): Promise<HsnRecord> {
    const result = await db.insert(hsns).values({ hsnCode: Number(data.hsnCode), hsnDescription: data.hsnDescription?.trim().toLowerCase() }).returning()
    return result[0]
  },

  async update(data: HSNUpdate): Promise<HsnRecord> {
    const result = await db.update(hsns).set(data).where(eq(hsns.id, data.id)).returning()
    return result[0]
  }

}



