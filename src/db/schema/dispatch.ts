import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user";
import { productVariants } from "./productVariant";
import { orderItems } from "./order";

// ─── Dispatches ───────────────────────────────────────────────────────────────

export const dispatchStatusEnum = pgEnum("dispatch_status", ["pending", "shipped", "delivered", "cancelled"]);

export const dispatches = pgTable(
  "dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchNumber: text("dispatch_number").notNull(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    notes: text("notes"),
    nop: integer("nop"),
    transport: text("transport"),
    status: dispatchStatusEnum("status").default("pending").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("dispatches_status_idx").on(table.status)]
);

// ─── Dispatch Items ───────────────────────────────────────────────────────────

export const dispatchItems = pgTable(
  "dispatch_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchId: uuid("dispatch_id")
      .notNull()
      .references(() => dispatches.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    totalQty: numeric("total_qty", { mode: "number", precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("dispatch_item_dispatch_idx").on(table.dispatchId),
    index("dispatch_item_variant_idx").on(table.variantId),
  ]
);

// ─── Dispatch Allocations ─────────────────────────────────────────────────────

export const dispatchAllocations = pgTable(
  "dispatch_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchItemId: uuid("dispatch_item_id")
      .notNull()
      .references(() => dispatchItems.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "restrict" }),
    allocatedQty: numeric("allocated_qty", { mode: "number", precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("dispatch_alloc_dispatch_item_idx").on(table.dispatchItemId),
    index("dispatch_alloc_order_item_idx").on(table.orderItemId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const dispatchRelations = relations(dispatches, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [dispatches.createdBy],
    references: [users.id],
  }),
  items: many(dispatchItems),
}));

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

export const dispatchAllocationRelations = relations(dispatchAllocations, ({ one }) => ({
  dispatchItem: one(dispatchItems, {
    fields: [dispatchAllocations.dispatchItemId],
    references: [dispatchItems.id],
  }),
  orderItem: one(orderItems, {
    fields: [dispatchAllocations.orderItemId],
    references: [orderItems.id],
  }),
}));
