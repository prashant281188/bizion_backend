import { and, count, eq, ilike } from 'drizzle-orm'
import { db } from '../db/db'
import { units, Unit, UnitUpdate, UnitRecord } from '../schema/schema'

export const Model =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;
  }): Promise<UnitRecord[]> {

    const conditions = []

    if (filters.search)
      conditions.push(ilike(units.unitLongName, `%${filters.search.trim()}%`))

    return await db.query.units.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search: string } }) {
    const conditions = []

    if (filters.search)
      conditions.push(ilike(units.unitLongName, `%${filters.search.trim()}%`))

    const result = await db.select({ count: count() }).from(units).where(
      conditions.length ? and(...conditions) : undefined
    )

    return Number(result[0]?.count ?? 0)
  },

  async getByName(name: string): Promise<UnitRecord | null> {
    return await db.query.units.findFirst({
      where: (eq(units.unitLongName, name))
    }) || null
  },

  async getByID(id: string): Promise<UnitRecord | null> {
    const result = await db.select().from(units).where(eq(units.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<UnitRecord | null> {
    const result = await db.delete(units).where(eq(units.id, id)).returning()
    return result[0] || null
  },

  async create(data: Unit): Promise<UnitRecord> {
    const result = await db.insert(units).values({ unitLongName: data.unitLongName.trim().toLowerCase(), unitShortName: data.unitShortName.trim().toLowerCase(), }).returning()
    return result[0]
  },

  async update(data: UnitUpdate): Promise<UnitRecord> {
    const result = await db.update(units).set(data).where(eq(units.id, data.id)).returning()
    return result[0]
  }

}




