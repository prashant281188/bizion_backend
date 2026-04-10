import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user";
import { dispatchItems } from "./dispatchItems";

export const dispatchStatusEnum = pgEnum("dispatch_status", ["pending", "shipped", "delivered", "cancelled"])

export const dispatches = pgTable("dispatches", {
    id: uuid("id").defaultRandom().primaryKey(),

    dispatchNumber: text("dispatch_number").notNull(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    notes: text("notes"),
    nop: integer("nop"),
    transport: text("transport"),

    status: dispatchStatusEnum("status").default("pending").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
},
    (table) => [
        index("dispatches_status_idx").on(table.status)
    ]
)

export const dispatchRelations = relations(dispatches, ({ one, many }) => ({
    createdByUser: one(users, {
        fields: [dispatches.createdBy],
        references: [users.id],
    }),
    items: many(dispatchItems),
}));
