import { eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { roles, permissions, rolePermissions } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { clearPermissionCache } from "../../services/permission.service";
import {
  AssignPermissionsInput,
  CreatePermissionInput,
  CreateRoleInput,
  ListPermissionInput,
  ListRoleInput,
  UpdatePermissionInput,
  UpdateRoleInput,
} from "./role.schema";

export const roleService = {
  /* ===== ROLES ===== */

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
    const role = await db.query.roles.findFirst({ where: eq(roles.id, id) });
    if (!role) throw new AppError("Role not found", 404);

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

    const [role] = await db.insert(roles).values(data).returning();
    return role;
  },

  async updateRole(id: string, data: UpdateRoleInput) {
    const [updated] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
    if (!updated) throw new AppError("Role not found", 404);
    clearPermissionCache(id);
    return updated;
  },

  async removeRole(id: string) {
    const [deleted] = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id });
    if (!deleted) throw new AppError("Role not found", 404);
    clearPermissionCache(id);
  },

  /* ===== PERMISSION ASSIGNMENT ===== */

  async assignPermissions(roleId: string, data: AssignPermissionsInput) {
    const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
    if (!role) throw new AppError("Role not found", 404);

    // Verify all permissionIds exist
    const found = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, data.permissionIds));

    if (found.length !== data.permissionIds.length) {
      throw new AppError("One or more permission IDs are invalid", 400);
    }

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await tx.insert(rolePermissions).values(
        data.permissionIds.map((permissionId) => ({ roleId, permissionId }))
      );
    });

    clearPermissionCache(roleId);
  },

  async revokePermission(roleId: string, permissionId: string) {
    const [deleted] = await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId))
      .returning({ roleId: rolePermissions.roleId });

    if (!deleted) throw new AppError("Permission assignment not found", 404);
    clearPermissionCache(roleId);
  },

  /* ===== PERMISSIONS ===== */

  async listPermissions({ page = 1, limit = 10, search }: ListPermissionInput) {
    const offset = (page - 1) * limit;
    const where = search ? ilike(permissions.code, `%${search}%`) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(permissions).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(permissions).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  async createPermission(data: CreatePermissionInput) {
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.code, data.code),
    });
    if (existing) throw new AppError("Permission code already exists", 409);

    const [permission] = await db.insert(permissions).values(data).returning();
    return permission;
  },

  async updatePermission(id: string, data: UpdatePermissionInput) {
    const [updated] = await db.update(permissions).set(data).where(eq(permissions.id, id)).returning();
    if (!updated) throw new AppError("Permission not found", 404);
    clearPermissionCache(); // Code changed — invalidate all role caches
    return updated;
  },

  async removePermission(id: string) {
    const [deleted] = await db.delete(permissions).where(eq(permissions.id, id)).returning({ id: permissions.id });
    if (!deleted) throw new AppError("Permission not found", 404);
    clearPermissionCache();
  },
};
