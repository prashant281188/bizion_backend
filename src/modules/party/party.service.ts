import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { parties } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreatePartyInput, ListPartyInput, UpdatePartyInput } from "./party.schema";

export const partyService = {
  async list({ page = 1, limit = 20, search, city, isActive }: ListPartyInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search)
      conditions.push(
        or(ilike(parties.name, `%${search}%`), ilike(parties.phone, `%${search}%`))
      );
    if (city) conditions.push(ilike(parties.city, `%${city}%`));
    if (isActive !== undefined) conditions.push(eq(parties.isActive, isActive));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(parties)
        .where(where)
        .orderBy(asc(parties.name))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(parties).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const party = await db.query.parties.findFirst({ where: eq(parties.id, id) });
    if (!party) throw new AppError("Party not found", 404);
    return party;
  },

  async create(data: CreatePartyInput) {
    const [party] = await db.insert(parties).values(data).returning();
    return party;
  },

  async update(id: string, data: UpdatePartyInput) {
    const [updated] = await db
      .update(parties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(parties.id, id))
      .returning();
    if (!updated) throw new AppError("Party not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(parties).where(eq(parties.id, id)).returning({ id: parties.id });
    if (!deleted) throw new AppError("Party not found", 404);
  },
};
