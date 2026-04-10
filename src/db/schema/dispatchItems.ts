import { index, numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dispatches } from "./dispatch";
import { productVariants } from "./productVariant";
import { dispatchAllocations } from "./dispatchAllocation";

export const dispatchItems = pgTable("dispatch_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchId: uuid("dispatch_id").notNull().references(() => dispatches.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
    // Total physical qty of this variant being shipped in this dispatch
    totalQty: numeric("total_qty", { mode: "number", precision: 12, scale: 2 }).notNull(),
},
    (table) => [
        index("dispatch_item_dispatch_idx").on(table.dispatchId),
        index("dispatch_item_variant_idx").on(table.variantId),
    ]
)

export const dispatchItemRelations = relations(dispatchItems, ({ one, many }) => ({
    dispatch: one(dispatches, {
        fields: [dispatchItems.dispatchId],
        references: [dispatches.id],
    }),
    variant: one(productVariants, {
        fields: [dispatchItems.variantId],
        references: [productVariants.id],
    }),
    allocations: many(dispatchAllocations),
}));
