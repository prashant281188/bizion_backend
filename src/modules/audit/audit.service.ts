import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { auditLogs } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { NewAuditLog } from "../../db/schema";
import { ListAuditInput } from "./audit.schema";

export const auditService = {
  /**
   * Log an audit event. Call this from other services after mutations.
   */
  async log(entry: NewAuditLog) {
    const [record] = await db.insert(auditLogs).values(entry).returning();
    return record;
  },

  async list({ page, limit, userId, entity, entityId, action, from, to }: ListAuditInput) {
    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (entity) conditions.push(eq(auditLogs.entity, entity));
    if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (from) conditions.push(gte(auditLogs.createdAt, from));
    if (to) conditions.push(lte(auditLogs.createdAt, to));

    const where = conditions.length ? and(...conditions) : undefined;
    const baseQuery = db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt));

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? baseQuery.limit(limit).offset(((page ?? 1) - 1) * limit)
        : baseQuery,
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
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
    const log = await db.query.auditLogs.findFirst({ where: eq(auditLogs.id, id) });
    if (!log) throw new AppError("Audit log not found", 404);
    return log;
  },
};
