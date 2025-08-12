import { and, count, eq, ilike } from 'drizzle-orm'
import { db } from '../db/db'

import {  transports, TransportRecord, TrasnportUpdate, Transport } from '../schema/schema'



export const transportModel =
{
  async getAll({ filters, offset, limit }: {
    filters: {
      search?: string;
    }
    offset: number;
    limit: number;
  }): Promise<TransportRecord[]> {

    const conditions = []

    if (filters.search)
      conditions.push(ilike(transports.name, `%${filters.search.trim()}%`))

    return await db.query.transports.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search: string } }) {
    const conditions = []

    if (filters.search)
      conditions.push(ilike(transports.name, `%${filters.search.trim()}%`))

    const result = await db.select({ count: count() }).from(transports).where(
      conditions.length ? and(...conditions) : undefined
    )

    return Number(result[0]?.count ?? 0)
  },

  async getByGstin(gstin: string): Promise<TransportRecord | null> {
    return await db.query.transports.findFirst({
      where: (eq(transports.gstin, gstin))
    }) || null
  },

  async getByID(id: string): Promise<TransportRecord | null> {
    const result = await db.select().from(transports).where(eq(transports.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<TransportRecord | null> {
    const result = await db.delete(transports).where(eq(transports.id, id)).returning()
    return result[0] || null
  },

  async create(data: Transport): Promise<TransportRecord> {
    const result = await db.insert(transports).values({ name: data.name.trim(), gstin: data.gstin, contact: data.contact }).returning()
    return result[0]
  },

  async update(data: TrasnportUpdate): Promise<TransportRecord> {
    const result = await db.update(transports).set(data).where(eq(transports.id, data.id)).returning()
    return result[0]
  }

}



