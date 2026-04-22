import { sql } from "drizzle-orm";
import { pgTable, uuid, text, numeric, timestamp, index, pgEnum, date, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { db } from "../../config/db";
import { parties } from "./party";
import { users } from "./user";
import { products } from "./product";
import { productVariants } from "./productVariant";
import { purchaseReceipts } from "./purchaseReceipt";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orderTypeEnum = pgEnum("order_type", ["purchase", "sale"]);
export const orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "partial", "completed", "cancelled"]);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderType: orderTypeEnum("order_type").notNull(),
    orderNumber: text("order_number").notNull().unique(),
    orderDate: date("order_date").defaultNow(),
    partyId: uuid("party_id").notNull().references(() => parties.id),
    salesmanId: uuid("salesman_id").notNull().references(() => users.id),
    status: orderStatusEnum("order_status").notNull().default("draft"),
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
    index("order_type_status_idx").on(table.orderType, table.status),
  ]
);

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),

    sku: text("sku").notNull(),
    boxQty: integer("box_qty").notNull(),
    packing: numeric("packing", { precision: 10, scale: 2 }).notNull(),

    orderQty: numeric("order_qty", { precision: 12, scale: 2 }),
    fulfilledQty: numeric("fulfilled_qty", { mode: "number", precision: 12, scale: 2 }).default(0),
    cancelledQty: numeric("cancelled_qty", { mode: "number", precision: 12, scale: 2 }).default(0),

    mrp: numeric("mrp", { precision: 12, scale: 2 }),
    discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),

    rate: numeric("rate", { precision: 12, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }),

    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("field_order_items_order_idx").on(table.orderId)]
);

// ─── Order Sequences ──────────────────────────────────────────────────────────

export const orderSequences = pgTable(
  "order_sequences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderType: orderTypeEnum("order_type").notNull(),
    financialYear: text("financial_year").notNull(),
    lastNumber: numeric("last_number").notNull().default("0"),
  },
  (table) => [index("order_seq_unique_idx").on(table.orderType, table.financialYear)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

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

export const fieldOrderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

// ─── Utilities ────────────────────────────────────────────────────────────────

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function getNextOrderNumber(tx: DbOrTx, orderType: "sale" | "purchase") {
  const result = await tx.execute(sql`
    UPDATE order_sequences
    SET last_number = last_number + 1
    WHERE order_type = ${orderType}
    RETURNING last_number;
  `);

  const nextNumber = Number(result[0].last_number);
  const prefix = orderType === "sale" ? "SAL" : "PUR";
  return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
}

export function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}
