import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user";

/* =====================================================
   TABLE
===================================================== */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),

    meta: jsonb("meta").$type<Record<string, any>>(),

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

export const auditLogRelations = relations(
  auditLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [auditLogs.userId],
      references: [users.id],
    }),
  })
);

/* =====================================================
   TYPES
===================================================== */

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
