import { and, count, eq, ilike } from 'drizzle-orm'
import { db } from '../db/db'

import { Tax, taxes, TaxRecord, TaxUpdate } from '../schema/schema'



export const Model =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;
  }): Promise<TaxRecord[]> {

    const conditions = []

    if (filters.search)
      conditions.push(ilike(taxes.taxName, `%${filters.search.trim()}%`))

    return await db.query.taxes.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search: string } }) {
    const conditions = []

    if (filters.search)
      conditions.push(ilike(taxes.taxName, `%${filters.search.trim()}%`))

    const result = await db.select({ count: count() }).from(taxes).where(
      conditions.length ? and(...conditions) : undefined
    )

    return Number(result[0]?.count ?? 0)
  },

  async getByName(name: string): Promise<TaxRecord | null> {
    return await db.query.taxes.findFirst({
      where: (eq(taxes.taxName, name))
    }) || null
  },

  async getByID(id: string): Promise<TaxRecord | null> {
    const result = await db.select().from(taxes).where(eq(taxes.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<TaxRecord | null> {
    const result = await db.delete(taxes).where(eq(taxes.id, id)).returning()
    return result[0] || null
  },

  async create(data: Tax): Promise<TaxRecord> {
    const result = await db.insert(taxes).values({ taxName: data.taxName.trim(), taxValue: data.taxValue }).returning()
    return result[0]
  },

  async update(data: TaxUpdate): Promise<TaxRecord> {
    const result = await db.update(taxes).set(data).where(eq(taxes.id, data.id)).returning()
    return result[0]
  }

}



