import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { optionValues } from "./optionValues";

/**
 * Global product option types shared across all products.
 * Examples: "Size", "Colour", "Material", "Flavour".
 *
 * Options are not per-product — they are a shared catalogue.
 * Each option has many optionValues (e.g. Size → S, M, L, XL).
 */
export const options = pgTable("options", {
  id: uuid("id").defaultRandom().primaryKey(),
  optionName: text("option_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const optionRelations = relations(options, ({ many }) => ({
  values: many(optionValues),
}));
