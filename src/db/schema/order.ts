import { pgTable, uuid, text, numeric, timestamp, index, pgEnum, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { parties } from "./party";
import { users } from "./user";
import { orderItems } from "./orderItem";
import { purchaseReceipts } from "./purchaseReceipt";

export const orderTypeEnum = pgEnum('order_type', ['purchase', 'sale'])
export const orderStatusEnum = pgEnum('order_status', ['draft', 'confirmed', 'partial', 'completed', 'cancelled'])


export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderType: orderTypeEnum('order_type').notNull(),
    orderNumber: text("order_number").notNull().unique(),
    orderDate: date("order_date").defaultNow(),
    partyId: uuid("party_id").notNull().references(() => parties.id),
    salesmanId: uuid("salesman_id").notNull().references(() => users.id),
    status: orderStatusEnum('order_status').notNull().default("draft").notNull(),
    notes: text("notes"),

    subTotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),

    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_party_idx").on(table.partyId),
    index("orders_salesman_idx").on(table.salesmanId),
    index("orders_status_idx").on(table.status),
    index("orders_date_idx").on(table.orderDate),
    index("order_type_status_idx").on(table.orderType, table.status)
  ]
);

export const partyRelations = relations(parties, ({ many }) => ({
  orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  party: one(parties, {
    fields: [orders.partyId],
    references: [parties.id],
  }),
  salesman: one(users, {
    fields: [orders.salesmanId],
    references: [users.id],
  }),
  items: many(orderItems),
  purchaseReceipts: many(purchaseReceipts),
}));
