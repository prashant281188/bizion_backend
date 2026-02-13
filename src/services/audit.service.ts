import { db } from "../config/db";
import { auditLogs } from "../db/schema/auditLog";

/* =====================================================
   AUDIT LOGGER
===================================================== */

export interface AuditPayload {
  userId?: string | null;
  action: string;          // e.g. "product:create"
  entity: string;          // e.g. "product"
  entityId?: string | null;
  meta?: Record<string, any>;
}

export async function logAudit(data: AuditPayload) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      meta: data.meta ?? null,
    });
  } catch (error) {
    // Do NOT break main request if audit fails
    console.error("Audit log failed:", error);
  }
}
