import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { options } from "./options";
import { relations } from "drizzle-orm";
import { variantOptionValues } from "./variantOptionValues";

export const optionValues = pgTable("option_values", {
    id: uuid("id").defaultRandom().primaryKey(),
    optionId: uuid("option_id")
        .references(() => options.id)
        .notNull(),
    value: text("value").notNull(),
    position: integer("position").default(0)
})

export const optionValueRelations = relations(optionValues, ({ one, many }) => ({
    option: one(options, {
        fields: [optionValues.optionId],
        references: [options.id]
    }),
    variantValues: many(variantOptionValues)
}))