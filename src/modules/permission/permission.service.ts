import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { permissions } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { clearPermissionCache } from "../../services/permission.service";
import { CreatePermissionInput, ListPermissionInput, UpdatePermissionInput } from "./permission.schema";

export const permissionService = {
  async list({ page = 1, limit = 99, search }: ListPermissionInput) {
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

  async getById(id: string) {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });
    if (!permission) throw new AppError("Permission not found", 404);
    return permission;
  },

  async create(data: CreatePermissionInput) {
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.code, data.code),
    });
    if (existing) throw new AppError("Permission code already exists", 409);

    const [permission] = await db.insert(permissions).values(data).returning();
    return permission;
  },

  async update(id: string, data: UpdatePermissionInput) {
    const [updated] = await db
      .update(permissions)
      .set(data)
      .where(eq(permissions.id, id))
      .returning();
    if (!updated) throw new AppError("Permission not found", 404);

    clearPermissionCache(); // code may have changed — invalidate all role caches
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(permissions)
      .where(eq(permissions.id, id))
      .returning({ id: permissions.id });
    if (!deleted) throw new AppError("Permission not found", 404);

    clearPermissionCache();
  },
};
