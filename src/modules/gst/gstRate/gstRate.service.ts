import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../config/db";
import { gstGroups, gstRates } from "../../../db/schema";
import { AppError } from "../../../middlewares/errorHandler";
import { CreateGstRateInput, ListGstRateInput, UpdateGstRateInput } from "./gstRate.schema";

export const gstRateService = {
  async list({ page, limit, gstGroupId }: ListGstRateInput) {
    const where = gstGroupId ? eq(gstRates.gstGroupId, gstGroupId) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.gstRates.findMany({
        where,
        limit: limit,
        offset: limit !== undefined ? ((page ?? 1) - 1) * limit : undefined,
        with: { gstGroup: { columns: { name: true } } },
      }),
      db.select({ count: sql<number>`count(*)` }).from(gstRates).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: { page: resolvedPage, limit: resolvedLimit, total, totalPages: limit ? Math.ceil(total / limit) : 1 },
    };
  },

  async getById(id: string) {
    const rate = await db.query.gstRates.findFirst({
      where: eq(gstRates.id, id),
      with: { gstGroup: { columns: { name: true } } },
    });
    if (!rate) throw new AppError("GST rate not found", 404);
    return rate;
  },

  async create(data: CreateGstRateInput) {
    const existingGroup = await db.query.gstGroups.findFirst({ where: eq(gstGroups.id, data.gstGroupId) });
    if (!existingGroup) throw new AppError("GST group not found", 404);

    const [rate] = await db
      .insert(gstRates)
      .values({
        gstGroupId: data.gstGroupId,
        cgst: String(data.cgst),
        sgst: String(data.sgst),
        igst: String(data.igst),
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      })
      .returning();
    return rate;
  },

  async update(id: string, data: UpdateGstRateInput) {
    const payload: Record<string, unknown> = {};
    if (data.cgst !== undefined) payload.cgst = String(data.cgst);
    if (data.sgst !== undefined) payload.sgst = String(data.sgst);
    if (data.igst !== undefined) payload.igst = String(data.igst);
    if (data.effectiveFrom !== undefined) payload.effectiveFrom = new Date(data.effectiveFrom);
    if (data.effectiveTo !== undefined) payload.effectiveTo = new Date(data.effectiveTo);

    const [updated] = await db.update(gstRates).set(payload).where(eq(gstRates.id, id)).returning();
    if (!updated) throw new AppError("GST rate not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(gstRates).where(eq(gstRates.id, id)).returning({ id: gstRates.id });
    if (!deleted) throw new AppError("GST rate not found", 404);
    return deleted;
  },
};
