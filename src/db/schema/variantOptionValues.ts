import { pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";
import { optionValues } from "./optionValues";

export const variantOptionValues = pgTable(
    "variant_option_values",
    {
        variantId: uuid("variant_id").notNull(),
        optionValueId: uuid("option_value_id"),
    },
    (table) => [
        uniqueIndex("variant_option_values_pk")
            .on(table.variantId, table.optionValueId),
    ]
);

export const variantOptionValueRelations = relations(
    variantOptionValues,
    ({ one }) => ({
        variant: one(productVariants, {
            fields: [variantOptionValues.variantId],
            references: [productVariants.id]
        }),

        optionValue: one(optionValues, {
            fields: [variantOptionValues.optionValueId],
            references: [optionValues.id]
        })
    })
)