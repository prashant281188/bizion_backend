import { db } from '../db/db'
import { Group, GroupRecord, groups, GroupUpdate } from '../schema/schema'
import { and, count, eq, ilike } from 'drizzle-orm'

export const Model =
{
  async getAll({ filters, offset, limit }: {
    filters: { search?: string }
    offset: number;
    limit: number;
  }): Promise<GroupRecord[]> {
    const conditions = [];
    if (filters.search) {
      conditions.push(ilike(groups.groupName, `%${filters.search.trim()}%`))
    }
    return await db.query.groups.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      offset,
      limit
    })
  },

  async count({ filters }: { filters: { search?: string; status?: string; } }) {
    const conditions = [];
    if (filters.search)
      conditions.push(ilike(groups.groupName, `%${filters.search}%`))

    const result = await db.select({ count: count() }).from(groups).where(
      conditions.length ? and(...conditions) : undefined
    )
    return Number(result[0]?.count ?? 0)
  },

  async getByName(name: string): Promise<GroupRecord | undefined> {
    return await db.query.groups.findFirst({ where: eq(groups.groupName, name.trim().toLowerCase()) })
  },

  async getByID(id: string): Promise<GroupRecord | null> {
    const result = await db.select().from(groups).where(eq(groups.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<GroupRecord | null> {
    const result = await db.delete(groups).where(eq(groups.id, id)).returning()
    return result[0] || null
  },

  async create(data: Group): Promise<GroupRecord> {
    const result = await db.insert(groups).values({
      groupName: data.groupName.toLowerCase().trim(),
      groupDescription: data.groupDescription?.toLowerCase().trim()
    }).returning()
    return result[0]
  },

  async update(data: GroupUpdate): Promise<GroupRecord> {
    const result = await db.update(groups).set(data).where(eq(groups.id, data.id)).returning()
    return result[0]
  }

}



