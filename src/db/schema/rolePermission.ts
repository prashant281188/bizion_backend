import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { roles } from "./role";
import { permissions } from "./permission";
import { relations } from "drizzle-orm";

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
  (table) => [
    primaryKey({
      columns: [table.roleId, table.permissionId],
    }),
  ]
);

