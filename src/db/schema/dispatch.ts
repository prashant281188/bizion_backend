import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const dispatches = pgTable("dispatches", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchNumber: text("dispatch_number").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
})