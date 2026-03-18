import { relations } from "drizzle-orm";
import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { optionValues } from "./optionValues";

export const options = pgTable("options", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique()
},
    (table) => [
        uniqueIndex("options_name_unique").on(table.name)
    ])

export const optionRelations = relations(options, ({ many }) => ({
    values: many(optionValues),
}))