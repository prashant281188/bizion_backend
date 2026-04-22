import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  numeric,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";
import { optionValues } from "./options";

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku"),
    barcode: text("barcode"),
    packing: numeric("packing", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("variants_sku_product_unique").on(table.sku, table.productId),
    uniqueIndex("variants_barcode_product_unique").on(table.barcode, table.productId),
    index("variants_product_idx").on(table.productId),
    index("variants_deleted_idx").on(table.isDeleted),
  ]
);

// ─── Variant Images ───────────────────────────────────────────────────────────

export const variantImages = pgTable(
  "variant_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    alt: text("alt"),
    position: integer("position").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("variant_images_variant_idx").on(table.productVariantId)]
);

// ─── Variant Rates (pricing history) ─────────────────────────────────────────

export const variantRates = pgTable(
  "variant_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    mrp:          numeric("mrp",           { precision: 12, scale: 2 }),
    purchaseRate: numeric("purchase_rate",  { precision: 12, scale: 2 }),
    saleRate:     numeric("sale_rate",      { precision: 12, scale: 2 }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("rates_variant_idx").on(table.variantId),
    index("rates_variant_effective_idx").on(table.variantId, table.effectiveFrom),
  ]
);

// ─── Variant Option Values (junction) ────────────────────────────────────────

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => optionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("variant_option_values_unique").on(table.variantId, table.optionValueId),
    index("vov_variant_idx").on(table.variantId),
    index("vov_option_value_idx").on(table.optionValueId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const productVariantRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  optionValues: many(variantOptionValues),
  rates: many(variantRates),
  images: many(variantImages),
}));

export const variantImageRelations = relations(variantImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantImages.productVariantId],
    references: [productVariants.id],
  }),
}));

export const variantRatesRelations = relations(variantRates, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [variantRates.variantId],
    references: [productVariants.id],
  }),
}));

export const variantOptionValueRelations = relations(variantOptionValues, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantOptionValues.variantId],
    references: [productVariants.id],
  }),
  optionValue: one(optionValues, {
    fields: [variantOptionValues.optionValueId],
    references: [optionValues.id],
  }),
}));
