import bcrypt from "bcrypt";
import { and, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { roles, users } from "../../db/schema";
import { db } from "../../config/db";
import { AppError } from "../../middlewares/errorHandler";
import { CreateUserInput, ListUserInput, UpdateUserInput } from "./user.schema";

const SALT_ROUNDS = 10;

const safeUserColumns = {
  id: users.id,
  phone: users.phone,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  roleId: users.roleId,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  roleName: roles.name,
};

export const userService = {
  async list({ page = 1, limit = 10, search, roleId, isActive }: ListUserInput) {
    const offset = (page - 1) * limit;

    const conditions = [isNull(users.deletedAt)];
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )!
      );
    }
    if (roleId) conditions.push(eq(users.roleId, roleId));
    if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db
        .select(safeUserColumns)
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(where)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(users).where(where),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  },

  async getById(id: string) {
    const [user] = await db
      .select(safeUserColumns)
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)));

    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async create(data: CreateUserInput) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existing) throw new AppError("Email already registered", 409);

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({ ...data, password: hashed })
      .returning();

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async update(id: string, data: UpdateUserInput) {
    const existing = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    });
    if (!existing) throw new AppError("User not found", 404);

    if (data.email && data.email !== existing.email) {
      const emailTaken = await db.query.users.findFirst({
        where: and(eq(users.email, data.email), ne(users.id, id)),
      });
      if (emailTaken) throw new AppError("Email already in use", 409);
    }

    const payload: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.password) {
      payload.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const [user] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, id))
      .returning();

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async remove(id: string) {
    const existing = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    });
    if (!existing) throw new AppError("User not found", 404);

    const [deleted] = await db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return deleted;
  },
};
