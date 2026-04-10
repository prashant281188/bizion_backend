import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { businessDetails } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { getS3Url } from "../../services/s3.service";
import { CreateBusinessInput, ListBusinessInput, UpdateBusinessInput } from "./business.schema";

function withS3Urls<T extends { logoUrl?: string | null; signatureUrl?: string | null }>(record: T) {
  return {
    ...record,
    ...(record.logoUrl      && { logoUrl:      getS3Url(record.logoUrl) }),
    ...(record.signatureUrl && { signatureUrl: getS3Url(record.signatureUrl) }),
  };
}

export const businessService = {
  async list({ page = 1, limit = 10, search }: ListBusinessInput) {
    const offset = (page - 1) * limit;
    const where = and(
      isNull(businessDetails.deletedAt),
      search
        ? or(
            ilike(businessDetails.legalName, `%${search}%`),
            ilike(businessDetails.tradeName, `%${search}%`),
          )
        : undefined
    );

    const [items, [{ count }]] = await Promise.all([
      db.select().from(businessDetails).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(businessDetails).where(where),
    ]);

    return {
      items: items.map(withS3Urls),
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const record = await db.query.businessDetails.findFirst({
      where: and(eq(businessDetails.id, id), isNull(businessDetails.deletedAt)),
    });
    if (!record) throw new AppError("Business not found", 404);
    return withS3Urls(record);
  },

  async create(data: CreateBusinessInput & { logoUrl?: string; signatureUrl?: string }) {
    if (data.gstin) {
      const existing = await db.query.businessDetails.findFirst({
        where: eq(businessDetails.gstin, data.gstin),
      });
      if (existing) throw new AppError("A business with this GSTIN already exists", 409);
    }
    if (data.panNo) {
      const existing = await db.query.businessDetails.findFirst({
        where: eq(businessDetails.panNo, data.panNo),
      });
      if (existing) throw new AppError("A business with this PAN already exists", 409);
    }

    const [record] = await db.insert(businessDetails).values(data).returning();
    return withS3Urls(record);
  },

  async update(id: string, data: UpdateBusinessInput & { logoUrl?: string; signatureUrl?: string }) {
    if (data.gstin) {
      const existing = await db.query.businessDetails.findFirst({
        where: and(eq(businessDetails.gstin, data.gstin), sql`${businessDetails.id} != ${id}`),
      });
      if (existing) throw new AppError("A business with this GSTIN already exists", 409);
    }
    if (data.panNo) {
      const existing = await db.query.businessDetails.findFirst({
        where: and(eq(businessDetails.panNo, data.panNo), sql`${businessDetails.id} != ${id}`),
      });
      if (existing) throw new AppError("A business with this PAN already exists", 409);
    }

    const [updated] = await db
      .update(businessDetails)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(businessDetails.id, id), isNull(businessDetails.deletedAt)))
      .returning();
    if (!updated) throw new AppError("Business not found", 404);
    return withS3Urls(updated);
  },

  async remove(id: string) {
    const [deleted] = await db
      .update(businessDetails)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(businessDetails.id, id), isNull(businessDetails.deletedAt)))
      .returning({ id: businessDetails.id });
    if (!deleted) throw new AppError("Business not found", 404);
  },

  async getRaw(id: string) {
    const record = await db.query.businessDetails.findFirst({
      where: and(eq(businessDetails.id, id), isNull(businessDetails.deletedAt)),
    });
    if (!record) throw new AppError("Business not found", 404);
    return record;
  },
};
