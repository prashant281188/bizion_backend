import { numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { dispatchItems } from "./dispatchItems";
import { fieldOrderItems } from "./fieldOrderItem";

export const dispatchAllocations = pgTable("dispact_allocations", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchItemId: uuid("dispatch_item_id").references(() => dispatchItems.id),
    fieldOrderItemId: uuid("order_item_id").references(() => fieldOrderItems.id),
    allocatedQty: numeric("allocated_qty", { mode: "number", precision: 12, scale: 2 }),
})