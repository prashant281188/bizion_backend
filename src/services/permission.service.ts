import { db } from "../config/db";
import { rolePermissions } from "../db/schema/rolePermission";
import { permissions } from "../db/schema/permission";
import { eq } from "drizzle-orm";

export async function getPermissionsByRole(roleId: string) {
  const rows = await db
    .select({
      code: permissions.code,
    })
    .from(rolePermissions)
    .innerJoin(
      permissions,
      eq(rolePermissions.permissionId, permissions.id)
    )
    .where(eq(rolePermissions.roleId, roleId));

  return rows.map((r) => r.code);
}
