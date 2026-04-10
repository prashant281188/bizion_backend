import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { roles, permissions, rolePermissions } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { clearPermissionCache } from "../../services/permission.service";
import {
  AssignPermissionsInput,
  CreateRoleInput,
  ListRoleInput,
  UpdateRoleInput,
  UpdatePermissionsInput,
} from "./role.schema";

async function getRole(id: string) {
  const role = await db.query.roles.findFirst({ where: eq(roles.id, id) });
  if (!role) throw new AppError("Role not found", 404);
  return role;
}

function guardSystemRole(role: { isSystem: boolean; name: string }) {
  if (role.isSystem)
    throw new AppError(`Role '${role.name}' is a system role and cannot be modified`, 403);
}

export const roleService = {
  async listRoles({ page = 1, limit = 10, search }: ListRoleInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(roles.name, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.query.roles.findMany({ where, limit, offset }),
      db.select({ count: sql<number>`count(*)` }).from(roles).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async getRoleById(id: string) {
    const role = await getRole(id);

    const perms = await db
      .select({ id: permissions.id, code: permissions.code, description: permissions.description })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    return { ...role, permissions: perms };
  },

  async createRole(data: CreateRoleInput) {
    const existing = await db.query.roles.findFirst({ where: eq(roles.name, data.name) });
    if (existing) throw new AppError("Role name already exists", 409);

    const [role] = await db.insert(roles).values({ ...data, isSystem: false }).returning();
    return role;
  },

  async updateRole(id: string, data: UpdateRoleInput) {
    const role = await getRole(id);
    guardSystemRole(role);

    const [updated] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
    if (!updated) throw new AppError("Role not found", 404);
    clearPermissionCache(id);
    return updated;
  },

  async removeRole(id: string) {
    const role = await getRole(id);
    guardSystemRole(role);

    const [deleted] = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id });
    if (!deleted) throw new AppError("Role not found", 404);
    clearPermissionCache(id);
  },

  async assignPermissions(roleId: string, data: AssignPermissionsInput) {
    const role = await getRole(roleId);
    guardSystemRole(role);

    const found = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, data.permissionIds));

    if (found.length !== data.permissionIds.length)
      throw new AppError("One or more permission IDs are invalid", 400);

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await tx.insert(rolePermissions).values(
        data.permissionIds.map((permissionId) => ({ roleId, permissionId }))
      );
    });

    clearPermissionCache(roleId);
  },

  async updatePermissions(roleId: string, data: UpdatePermissionsInput) {
    const role = await getRole(roleId);
    guardSystemRole(role);

    await db.transaction(async (tx) => {
      if (data.add?.length) {
        const found = await tx
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.id, data.add));
        if (found.length !== data.add.length)
          throw new AppError("One or more permission IDs in 'add' are invalid", 400);

        await tx
          .insert(rolePermissions)
          .values(data.add.map((permissionId) => ({ roleId, permissionId })))
          .onConflictDoNothing();
      }

      if (data.remove?.length) {
        await tx
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              inArray(rolePermissions.permissionId, data.remove)
            )
          );
      }
    });

    clearPermissionCache(roleId);
  },

  async revokePermission(roleId: string, permissionId: string) {
    const role = await getRole(roleId);
    guardSystemRole(role);

    const [deleted] = await db
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
      .returning({ roleId: rolePermissions.roleId });

    if (!deleted) throw new AppError("Permission assignment not found", 404);
    clearPermissionCache(roleId);
  },
};
