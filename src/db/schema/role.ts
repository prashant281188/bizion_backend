import { relations } from "drizzle-orm";
import { boolean, pgTable, uuid, text, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { users } from "./user";

// ─── Permissions ──────────────────────────────────────────────────────────────

export const permissions = pgTable(
    "permissions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        code: text("code").notNull().unique(),
        description: text("description"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    }
);

// ─── Roles ────────────────────────────────────────────────────────────────────

export const roles = pgTable("roles", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    isSystem: boolean("is_system").default(false).notNull(),
});

// ─── Role Permissions (junction) ──────────────────────────────────────────────

export const rolePermissions = pgTable(
    "role_permissions",
    {
        roleId: uuid("role_id")
            .references(() => roles.id, { onDelete: "cascade" })
            .notNull(),
        permissionId: uuid("permission_id")
            .references(() => permissions.id, { onDelete: "cascade" })
            .notNull(),
    },
    (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const roleRelations = relations(roles, ({ many }) => ({
    users: many(users),
    rolePermissions: many(rolePermissions),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}));

export const rolePermissionRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
