import { and, asc, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { gstRates, hsnCodes, hsnGstHistory } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { AssignGstGroupInput, CreateHsnInput, ListHsnInput, UpdateHsnInput } from "./hsn.schema";

export const hsnService = {

  /* ─────────────────────────────────────────────────
     LIST
     Returns paginated HSN codes.
     Each item includes the CURRENT active GST assignment
     (hsnGstHistory row where effectiveTo IS NULL) together
     with the current GST rate (cgst / sgst / igst).
     Full history is available via GET /hsn/:id.
  ───────────────────────────────────────────────── */

  async list({ page = 1, limit = 10, search, isActive }: ListHsnInput) {
    const offset = (page - 1) * limit;

    const filters = [];
    if (isActive !== undefined) filters.push(eq(hsnCodes.isActive, isActive));
    if (search) filters.push(ilike(hsnCodes.hsnCode, `%${search}%`));
    const where = filters.length ? and(...filters) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.hsnCodes.findMany({
        where,
        limit,
        offset,
        orderBy: [asc(hsnCodes.hsnCode)],
        with: {
          // Only the currently active GST assignment (effectiveTo IS NULL)
          gstHistory: {
            where: isNull(hsnGstHistory.effectiveTo),
            limit: 1,
            columns: { id: true, effectiveFrom: true },
            with: {
              gstGroup: {
                columns: { id: true, name: true },
                with: {
                  // Current rate for this group
                  rates: {
                    where: isNull(gstRates.effectiveTo),
                    limit: 1,
                    columns: { id: true, cgst: true, sgst: true, igst: true, effectiveFrom: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(hsnCodes).where(where),
    ]);

    return {
      items: items.map(flattenHsnCurrentGst),
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  },

  /* ─────────────────────────────────────────────────
     GET BY ID
     Returns full detail including the complete GST
     assignment history, newest entry first.
     Each history entry includes the GST group name
     and the current (open-ended) rate for that group.
  ───────────────────────────────────────────────── */

  async getById(id: string) {
    const hsn = await db.query.hsnCodes.findFirst({
      where: eq(hsnCodes.id, id),
      with: {
        // Full history, newest assignment first
        gstHistory: {
          orderBy: [desc(hsnGstHistory.effectiveFrom)],
          columns: {
            id: true, effectiveFrom: true, effectiveTo: true, createdAt: true,
          },
          with: {
            gstGroup: {
              columns: { id: true, name: true, isActive: true },
              with: {
                // Current rate for this group (effectiveTo IS NULL)
                rates: {
                  where: isNull(gstRates.effectiveTo),
                  limit: 1,
                  columns: { id: true, cgst: true, sgst: true, igst: true, effectiveFrom: true },
                },
              },
            },
          },
        },
      },
    });

    if (!hsn) throw new AppError("HSN not found", 404);

    // Shape history so each entry carries a resolved currentRate
    return {
      ...hsn,
      gstHistory: hsn.gstHistory.map((h) => ({
        id:            h.id,
        effectiveFrom: h.effectiveFrom,
        effectiveTo:   h.effectiveTo,
        createdAt:     h.createdAt,
        isCurrent:     h.effectiveTo === null,
        gstGroup: {
          id:        h.gstGroup.id,
          name:      h.gstGroup.name,
          isActive:  h.gstGroup.isActive,
          currentRate: h.gstGroup.rates[0] ?? null,
        },
      })),
    };
  },

  /* ─────────────────────────────────────────────────
     CREATE
  ───────────────────────────────────────────────── */

  async create(data: CreateHsnInput) {
    const existing = await db.query.hsnCodes.findFirst({
      where: eq(hsnCodes.hsnCode, data.hsnCode),
    });
    if (existing) throw new AppError("HSN code already exists", 409);

    const [hsn] = await db.insert(hsnCodes).values(data).returning();
    return hsn;
  },

  /* ─────────────────────────────────────────────────
     UPDATE
  ───────────────────────────────────────────────── */

  async update(id: string, data: UpdateHsnInput) {
    const [updated] = await db
      .update(hsnCodes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hsnCodes.id, id))
      .returning();

    if (!updated) throw new AppError("HSN not found", 404);
    return updated;
  },

  /* ─────────────────────────────────────────────────
     REMOVE (soft-deactivate)
  ───────────────────────────────────────────────── */

  async remove(id: string) {
    const [updated] = await db
      .update(hsnCodes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(hsnCodes.id, id))
      .returning({ id: hsnCodes.id });

    if (!updated) throw new AppError("HSN not found", 404);
    return { message: "HSN deactivated successfully" };
  },

  /* ─────────────────────────────────────────────────
     ASSIGN GST GROUP
     Creates a new hsnGstHistory entry.
     Closes any currently open entry (effectiveTo = now)
     so only one entry is active at a time.
  ───────────────────────────────────────────────── */

  async assignGstGroup(hsnId: string, data: AssignGstGroupInput) {
    return db.transaction(async (tx) => {
      const hsn = await tx.query.hsnCodes.findFirst({ where: eq(hsnCodes.id, hsnId) });
      if (!hsn) throw new AppError("HSN not found", 404);

      const group = await tx.query.gstGroups.findFirst({
        where: (g, { eq }) => eq(g.id, data.gstGroupId),
      });
      if (!group) throw new AppError("GST group not found", 404);

      // Close the currently open history entry
      await tx
        .update(hsnGstHistory)
        .set({ effectiveTo: new Date(data.effectiveFrom) })
        .where(and(eq(hsnGstHistory.hsnId, hsnId), isNull(hsnGstHistory.effectiveTo)));

      const [entry] = await tx
        .insert(hsnGstHistory)
        .values({
          hsnId,
          gstGroupId:    data.gstGroupId,
          effectiveFrom: new Date(data.effectiveFrom),
          effectiveTo:   data.effectiveTo ? new Date(data.effectiveTo) : undefined,
        })
        .returning();

      return entry;
    });
  },

  /* ─────────────────────────────────────────────────
     REMOVE GST HISTORY ENTRY
     Hard-deletes a specific history row.
     Use with caution — prefer closing (effectiveTo) over deletion.
  ───────────────────────────────────────────────── */

  async removeGstHistory(hsnId: string, historyId: string) {
    const entry = await db.query.hsnGstHistory.findFirst({
      where: and(eq(hsnGstHistory.id, historyId), eq(hsnGstHistory.hsnId, hsnId)),
    });
    if (!entry) throw new AppError("GST history entry not found", 404);

    const [deleted] = await db
      .delete(hsnGstHistory)
      .where(eq(hsnGstHistory.id, historyId))
      .returning({ id: hsnGstHistory.id });

    return deleted;
  },
};

/* =====================================================
   PRIVATE HELPER
   Flattens the raw Drizzle nested shape into a clean
   currentGst object for list responses.
===================================================== */

function flattenHsnCurrentGst(hsn: any) {
  const histEntry  = hsn.gstHistory?.[0] ?? null;
  const gstGroup   = histEntry?.gstGroup  ?? null;
  const gstRate    = gstGroup?.rates?.[0] ?? null;

  return {
    id:          hsn.id,
    hsnCode:     hsn.hsnCode,
    description: hsn.description,
    isActive:    hsn.isActive,
    createdAt:   hsn.createdAt,
    updatedAt:   hsn.updatedAt,
    currentGst: gstGroup
      ? {
          gstHistoryId:  histEntry.id,
          assignedFrom:  histEntry.effectiveFrom,
          groupId:       gstGroup.id,
          groupName:     gstGroup.name,
          rateId:        gstRate?.id   ?? null,
          cgst:          gstRate?.cgst  ?? null,
          sgst:          gstRate?.sgst  ?? null,
          igst:          gstRate?.igst  ?? null,
          rateEffectiveFrom: gstRate?.effectiveFrom ?? null,
        }
      : null,
  };
}
