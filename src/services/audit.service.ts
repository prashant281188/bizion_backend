import { db } from "../config/db";
import { auditLogs } from "../db/schema/auditLog";

/* =====================================================
   TYPES
===================================================== */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "login"
  | "logout"
  | "export"
  | "import";

export interface AuditPayload {
  userId?: string | null;
  action: AuditAction;
  entity: string;                      // e.g. "party", "order"
  entityId?: string | null;
  entityLabel?: string | null;         // human-readable name
  ipAddress?: string | null;
  userAgent?: string | null;
  before?: Record<string, any> | null; // snapshot before mutation
  after?: Record<string, any> | null;  // snapshot after mutation
  meta?: Record<string, any> | null;
}

/* =====================================================
   HELPER — extract client IP from request headers
===================================================== */

export function getClientIp(req: { headers: Record<string, any>; socket?: any }): string | null {
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  return forwarded?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
}

/* =====================================================
   AUDIT LOGGER
===================================================== */

export async function logAudit(data: AuditPayload): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      entityLabel: data.entityLabel ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      before: data.before ?? null,
      after: data.after ?? null,
      meta: data.meta ?? null,
    });
  } catch (error) {
    // Do NOT break the main request if audit fails
    console.error("Audit log failed:", error);
  }
}
