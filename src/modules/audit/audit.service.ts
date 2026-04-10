import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { auditLogs } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { NewAuditLog } from "../../db/schema/auditLog";
import { ListAuditInput } from "./audit.schema";

export const auditService = {
  /**
   * Log an audit event. Call this from other services after mutations.
   */
  async log(entry: NewAuditLog) {
    const [record] = await db.insert(auditLogs).values(entry).returning();
    return record;
  },

  async list({ page = 1, limit = 20, userId, entity, entityId, action, from, to }: ListAuditInput) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (entity) conditions.push(eq(auditLogs.entity, entity));
    if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (from) conditions.push(gte(auditLogs.createdAt, from));
    if (to) conditions.push(lte(auditLogs.createdAt, to));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getById(id: string) {
    const log = await db.query.auditLogs.findFirst({ where: eq(auditLogs.id, id) });
    if (!log) throw new AppError("Audit log not found", 404);
    return log;
  },
};
