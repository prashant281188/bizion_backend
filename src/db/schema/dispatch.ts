import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user";
import { dispatchItems } from "./dispatchItems";

export const dispatches = pgTable("dispatches", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchNumber: text("dispatch_number").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
})

export const dispatchRelations = relations(dispatches, ({ one, many }) => ({
    createdByUser: one(users, {
        fields: [dispatches.createdBy],
        references: [users.id],
    }),
    items: many(dispatchItems),
}));