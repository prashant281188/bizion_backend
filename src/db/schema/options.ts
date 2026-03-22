import { relations } from "drizzle-orm";
import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { optionValues } from "./optionValues";

export const options = pgTable("options", {
    id: uuid("id").defaultRandom().primaryKey(),
    optionName: text("option_name").notNull().unique()
},
)

export const optionRelations = relations(options, ({ many }) => ({
    values: many(optionValues),
}))