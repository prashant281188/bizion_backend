import bcrypt from "bcrypt";

import { eq, ilike, sql } from "drizzle-orm";
import { roles, users } from "../../db/schema";
import { db } from "../../config/db";

const SALT_ROUNDS = 10;

export const userService = {
  async list({ page = 1, limit = 10, search }) {
    const offset = (page - 1) * limit;

    const where = search
      ? ilike(users.email, `%${search}%`)
      : undefined;

    const items = await db
      .select({
        ...users,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(where)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where);

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
    return db
      .select({
        ...users,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id));
  },

  async create(data: any) {
    const hashed = await bcrypt.hash(
      data.password,
      SALT_ROUNDS
    );

    const [user] = await db
      .insert(users)
      .values({
        ...data,
        password: hashed,
      })
      .returning();

    return user;
  },

  async update(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(
        data.password,
        SALT_ROUNDS
      );
    }

    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return user ?? null;
  },

  async remove(id: string) {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    return result.rowCount > 0;
  },
};
