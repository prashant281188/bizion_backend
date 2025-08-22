import z from "zod"
import { numeric, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

import { products } from "./product"
import slugify from "slugify"

export const productVariants = pgTable("productVariants", {
  id: uuid().primaryKey().defaultRandom(),
  modelId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  size: varchar(),
  finish: varchar(),
  boxQty: numeric({ mode: "number", precision: 2 }),
  mrp: numeric({ mode: "number" }),
  purchaseDiscount: numeric({ mode: "number" }),
  purchaseRate: numeric({ mode: "number" }),
  saleDiscount: numeric({ mode: "number" }),
  saleRate: numeric({ mode: "number" }),
  // slug: text("slug").notNull().unique()
})



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

export type ProductVariantUpdate = z.infer<typeof productVariantUpdateSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>


export const generateVariantSlug = (
  productName: string,
  size?: string,
  finish?: string
) => slugify(`${productName}-${size}-${finish}`, { lower: true, strict: true })

