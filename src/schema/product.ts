import { relations } from "drizzle-orm"
import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { hsns } from "./hsn"
import { categories } from "./category"
import { taxes } from "./tax"
import { units } from "./unit"
import z from "zod"
// -------------------------------------------------------PRODUCT------------------------------------------------------------//

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  model: varchar().unique().notNull(),
  manufacture: varchar(),
  brand: varchar(),
  hsnId: uuid().notNull(),
  categoryId: uuid(),
  taxId: uuid().notNull(),
  unitId: uuid().notNull(),
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


// validataion schemas
export const productVariantSchema = z.object({
  productId: z.string().nullable().optional(),
  size: z.string(),
  finish: z.string(),
  boxQty: z.coerce.number({ coerce: true }).nullable().optional(),
  mrp: z.coerce.number().nullable().optional(),
  purchaseDiscount: z.coerce.number().nullable().optional(),
  purchaseRate: z.coerce.number().nullable().optional(),
  saleRate: z.coerce.number().nullable().optional(),
  saleDiscount: z.coerce.number().nullable().optional(),
})

export const productVariantUpdateSchema = productVariantSchema.extend({
  id: z.string().uuid()
})

export type ProductVariantUpdateInput = z.infer<typeof productVariantUpdateSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>

// --------------------------------------------------------------------------------

export const productSchema = z.object({
  model: z.string().min(1, { message: "prodcut name is required" }),
  hsnId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid(),
  taxId: z.string().uuid(),
  metal: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  manufacture: z.string().nullable().optional(),
  variants: z.array(productVariantSchema).min(1, { message: "at least one variant is required" })
})

export const productUpdateSchema = productSchema.extend({
  id: z.string().uuid(),
  variants: z.array(productVariantUpdateSchema).min(1, { message: "at lease on variant is required" })

})

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductInput = z.infer<typeof productSchema>