import { eq } from 'drizzle-orm'
import { db } from '../db/db'

import { Group, groups } from '../schema/schema'
import { GroupInput } from '../validators/validatorSchema'



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
  async create(data: GroupInput): Promise<Group> {
    const result = await db.insert(groups).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<GroupInput>): Promise<Group> {
    const result = await db.update(groups).set(data).where(eq(groups.id, id)).returning()
    return result[0]
  }

}



