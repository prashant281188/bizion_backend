import {  pgTable, text, uuid } from "drizzle-orm/pg-core";
import z from "zod";
import { products } from "./product";
import { relations } from "drizzle-orm";

export const productImages = pgTable('productImages', {
    id: uuid().defaultRandom().primaryKey(),
    path: text("path").notNull(),
    modelId: uuid().notNull().references(() => products.id, { onDelete: "cascade" })
})


export type NewImageInsert = typeof productImages.$inferInsert

export const imageProductRelation = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.modelId],
        references: [products.id]
    })
}))


export const productImageSchema = z.object({
    modelId: z.string().nullable().optional(),
    image: z.string()
})

export const productImageUpdateSchema = productImageSchema.extend({
    id: z.string().uuid()
})

export type ProductImageInput = z.infer<typeof productImageSchema>
export type ProductImageUpdate = z.infer<typeof productImageUpdateSchema>