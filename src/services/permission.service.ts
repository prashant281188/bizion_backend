import { db } from "../config/db";
import { rolePermissions } from "../db/schema/rolePermission";
import { permissions } from "../db/schema/permission";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { codes: string[]; expiresAt: number }>();

export async function getPermissionsByRole(roleId: string): Promise<string[]> {
  const cached = cache.get(roleId);
  if (cached && cached.expiresAt > Date.now()) return cached.codes;

  const rows = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  const codes = rows.map((r) => r.code);
  cache.set(roleId, { codes, expiresAt: Date.now() + CACHE_TTL_MS });

  return codes;
}

export function clearPermissionCache(roleId?: string) {
  if (roleId) {
    cache.delete(roleId);
  } else {
    cache.clear();
  }
}
