import {
    pgTable,
    uuid,
    text,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rolePermissions } from "./rolePermission";

/* =====================================================
   PERMISSIONS TABLE
===================================================== */

export const permissions = pgTable(
    "permissions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // Example: "category:create"
        code: text("code").notNull().unique(),

        description: text("description"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    }
);

/* =====================================================
   RELATIONS
===================================================== */



/* =====================================================
   TYPES
===================================================== */

export type Permission =
    typeof permissions.$inferSelect;

export type NewPermission =
    typeof permissions.$inferInsert;
