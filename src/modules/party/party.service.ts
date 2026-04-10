import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { parties } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreatePartyInput, ListPartyInput, UpdatePartyInput } from "./party.schema";

export const partyService = {
  async list({
    page = 1,
    limit = 20,
    search,
    type,
    gstRegistrationType,
    state,
    stateCode,
    isActive,
  }: ListPartyInput) {
    const offset = (page - 1) * limit;

    const conditions = [eq(parties.isDeleted, false)];

    if (search)
      conditions.push(
        or(
          ilike(parties.name, `%${search}%`),
          ilike(parties.tradeName, `%${search}%`),
          ilike(parties.phone, `%${search}%`),
          ilike(parties.gstNo, `%${search}%`),
          ilike(parties.panNo, `%${search}%`)
        )!
      );
    if (type) conditions.push(eq(parties.type, type));
    if (gstRegistrationType)
      conditions.push(eq(parties.gstRegistrationType, gstRegistrationType));
    if (state) conditions.push(ilike(parties.state, `%${state}%`));
    if (stateCode) conditions.push(eq(parties.stateCode, stateCode));
    if (isActive !== undefined) conditions.push(eq(parties.isActive, isActive));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(parties).where(where).orderBy(asc(parties.name)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(parties).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const party = await db.query.parties.findFirst({
      where: and(eq(parties.id, id), eq(parties.isDeleted, false)),
    });
    if (!party) throw new AppError("Party not found", 404);
    return party;
  },

  async create(data: CreatePartyInput) {
    // Derive PAN from GSTIN if not provided
    const panNo = data.panNo || (data.gstNo ? data.gstNo.slice(2, 12) : undefined);
    // Derive stateCode from GSTIN if not provided
    const stateCode = data.stateCode || (data.gstNo ? data.gstNo.slice(0, 2) : undefined);

    const [party] = await db
      .insert(parties)
      .values({ ...data, panNo, stateCode })
      .returning();
    return party;
  },

  async update(id: string, data: UpdatePartyInput) {
    await partyService.getById(id); // ensure exists

    const panNo = data.panNo ?? (data.gstNo ? data.gstNo.slice(2, 12) : undefined);
    const stateCode = data.stateCode ?? (data.gstNo ? data.gstNo.slice(0, 2) : undefined);

    const [updated] = await db
      .update(parties)
      .set({ ...data, ...(panNo && { panNo }), ...(stateCode && { stateCode }), updatedAt: new Date() })
      .where(and(eq(parties.id, id), eq(parties.isDeleted, false)))
      .returning();
    if (!updated) throw new AppError("Party not found", 404);
    return updated;
  },

  async remove(id: string) {
    await partyService.getById(id); // ensure exists
    await db
      .update(parties)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(parties.id, id));
  },
};
