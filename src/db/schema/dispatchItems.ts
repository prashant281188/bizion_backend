import { numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { dispatches } from "./dispatch";
import { orderItems } from "./fieldOrderItem";
import { productVariants } from "./productVariant";

export const dispatchItems = pgTable("dispatch_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchId: uuid("dispatch_id").references(() => dispatches.id),
    orderItemId: uuid("ordet_item_id").references(() => orderItems.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    totalQty: numeric("total_qty", { mode: "number", precision: 12, scale: 2 })
})