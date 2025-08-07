import { relations } from "drizzle-orm"
import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { hsns } from "./hsn"
import { categories } from "./category"
import { taxes } from "./tax"
import { units } from "./unit"
// -------------------------------------------------------PRODUCT------------------------------------------------------------//

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().unique(),
  manufacture: varchar(),
  brand: varchar(),
  hsnId: uuid().notNull(),
  categoryId: uuid(),
  taxId: uuid(),
  unitId: uuid(),
  metal: varchar(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert


// -------------------------------------------------------PRODUCT VARIANTS------------------------------------------------------------//

export const productVariants = pgTable("productVariants", {
  id: uuid().primaryKey().defaultRandom(),
  modelId: uuid(),
  size: varchar(),
  finish: varchar(),
  boxQty: numeric({ mode: "number", precision: 2 }),
  mrp: numeric({ mode: "number" }),
  purchaseDiscount: numeric({ mode: "number" }),
  purchaseRate: numeric({ mode: "number" }),
  saleDiscount: numeric({ mode: "number" }),
  saleRate: numeric({ mode: "number" }),
})

export type ProductVariant = typeof productVariants.$inferSelect
export type NewProductVariant = typeof productVariants.$inferInsert


// --------------------------------------------------------PRODUCT RELATIONSHIPS----------------------------------------------------------------//


export const hsnRelations = relations(hsns, ({ many }) => ({
  products: many(products)
}))

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(products)
}))

export const taxRelations = relations(taxes, ({ many }) => ({
  products: many(products)
}))

export const unitRelations = relations(units, ({ many }) => ({
  products: many(products)
}))


export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  hsn: one(hsns, {
    fields: [products.hsnId],
    references: [hsns.id]
  }),
  tax: one(taxes, {
    fields: [products.taxId],
    references: [taxes.id]
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id]
  }),
  variants: many(productVariants)
}))


export const productVariantRelation = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.modelId],
    references: [products.id]
  })
}))