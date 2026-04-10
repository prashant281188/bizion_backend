import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    action: text("action").notNull(),      // create | update | delete | restore | login | logout | export | import
    entity: text("entity").notNull(),      // e.g. "party", "product", "order"
    entityId: text("entity_id"),
    entityLabel: text("entity_label"),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    before: jsonb("before").$type<Record<string, any>>(),
    after: jsonb("after").$type<Record<string, any>>(),
    meta: jsonb("meta").$type<Record<string, any>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_entity_idx").on(table.entity),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
