import { relations } from "drizzle-orm"
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { hsns } from "./hsn"
import { categories } from "./category"
import { taxes } from "./tax"
import { units } from "./unit"
import z from "zod"
import { productVariants, productVariantSchema, productVariantUpdateSchema } from "./productVariant"
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