import { db } from '../db/db'
import { Group, groups, GroupUpdate } from '../schema/schema'
import { eq } from 'drizzle-orm'

export const Model =
{
  async getAll(): Promise<Group[]> {
    return await db.select().from(groups)
  },

  async getByID(id: string): Promise<Group | null> {
    const result = await db.select().from(groups).where(eq(groups.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Group | null> {
    const result = await db.delete(groups).where(eq(groups.id, id)).returning()
    return result[0] || null
  },
  
  async create(data: Group): Promise<Group> {
    const result = await db.insert(groups).values(data).returning()
    return result[0]
  },

  async update(data: GroupUpdate): Promise<Group> {
    const result = await db.update(groups).set(data).where(eq(groups.id, data.id)).returning()
    return result[0]
  }

}



