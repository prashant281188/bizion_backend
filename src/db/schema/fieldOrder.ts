import { pgTable, uuid, text, numeric, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { parties } from "./party";
import { users } from "./user";
import { fieldOrderItems } from "./fieldOrderItem";

export const orderStatusEnum = pgEnum('order_status', ['draft', 'confirmed', 'cancelled'])


export const fieldOrders = pgTable(
  "field_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id),
    salesmanId: uuid("salesman_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum('order_status').notNull().default("draft").notNull(),
    notes: text("notes"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("field_orders_party_idx").on(table.partyId),
    index("field_orders_salesman_idx").on(table.salesmanId),
    index("field_orders_status_idx").on(table.status),
  ]
);

export const fieldOrderRelations = relations(fieldOrders, ({ one, many }) => ({
  party: one(parties, {
    fields: [fieldOrders.partyId],
    references: [parties.id],
  }),
  salesman: one(users, {
    fields: [fieldOrders.salesmanId],
    references: [users.id],
  }),
  items: many(fieldOrderItems),
}));
