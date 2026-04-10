import { pgTable, uuid, integer, text, timestamp, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productVariants } from "./productVariant";
import { parties } from "./party";

export const txTypeEnum = pgEnum("inventory_tx_type", [
  "purchase",
  "sale",
  "adjustment",
  "return",
  "transfer",
]);

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    location: text("location").default("default").notNull(),
    // Current physical stock on hand
    quantityOnHand: integer("quantity_on_hand").default(0).notNull(),
    // Qty reserved for confirmed but not yet dispatched orders
    quantityReserved: integer("quantity_reserved").default(0).notNull(),
    // Qty on open purchase orders (ordered from supplier, not yet received)
    quantityOrdered: integer("quantity_ordered").default(0).notNull(),
    // Qty that needs to be ordered (reorder demand / manual override)
    quantityToOrder: integer("quantity_to_order").default(0).notNull(),
    // Threshold at which restocking should be triggered
    reorderPoint: integer("reorder_point").default(0).notNull(),
    // Default qty to order when reorder is triggered
    reorderQty: integer("reorder_qty").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("inventory_variant_location_unique").on(table.variantId, table.location),
    index("inventory_variant_idx").on(table.variantId),
  ]
);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").references(() => parties.id, { onDelete: "set null" }),
    type: txTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    location: text("location").default("default").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("inv_tx_variant_idx").on(table.variantId),
    index("inv_tx_party_idx").on(table.partyId),
    index("inv_tx_type_idx").on(table.type),
  ]
);

export const inventoryRelations = relations(inventory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
}));

export const inventoryTransactionRelations = relations(inventoryTransactions, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryTransactions.variantId],
    references: [productVariants.id],
  }),
  party: one(parties, {
    fields: [inventoryTransactions.partyId],
    references: [parties.id],
  }),
}));
