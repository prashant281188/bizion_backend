// db/schema/hsn.ts

import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index
} from "drizzle-orm/pg-core";
import { hsnGstHistory } from "./hsnGstHistory";

export const hsnCodes = pgTable("hsn_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  hsnCode: varchar("hsn_code", { length: 10 }).notNull().unique(), // 7604
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("hsn_code_idx").on(table.hsnCode)
]);


export const hsnRelations = relations(hsnCodes, ({ many }) => ({
  gstHistory: many(hsnGstHistory)
}))