import { relations } from "drizzle-orm"
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { hsns } from "./hsn"
import { categories } from "./category"
import { taxes } from "./tax"
import { units } from "./unit"
import z from "zod"
import { productVariants, productVariantSchema, productVariantUpdateSchema } from "./productVariant"
import { productImages } from "./productImage"
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
  variants: many(productVariants),
  images: many(productImages)
}))

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
})

export const productUpdateSchema = productSchema.extend({
  id: z.string().uuid(),
})

export const productWithVariantSchema = productSchema.extend({
  variants: z.array(productVariantSchema).min(1, { message: "At least one varinat is required" })
})
export const productWithVariantUpdateSchema = productUpdateSchema.extend({
  variants: z.array(z.union([productVariantSchema, productVariantUpdateSchema])).min(1, { message: "at lease on variant is required" }),
})

export type ProducInput = z.infer<typeof productSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>
export type ProductWithVariantInput = z.infer<typeof productWithVariantSchema>
export type ProductWithVariantUpdate = z.infer<typeof productWithVariantUpdateSchema>
