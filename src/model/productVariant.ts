import { eq } from 'drizzle-orm'
import { db } from '../db/db'

import { generateVariantSlug, ProductVariantInput, productVariants, ProductVariantUpdate } from '../schema/schema'

export const productVariantModel =
{
  async getAll() {
    return await db.query.productVariants.findMany()
  },

  async getByID(id: string) {
    return (await db.select().from(productVariants).where(eq(productVariants.id, id)))[0]
  },

  async delete(id: string) {
    return (await db.delete(productVariants).where(eq(productVariants.id, id)).returning())[0]
  },

  async create(data: ProductVariantInput, modelId: string, model: string) {
    const slug = generateVariantSlug(model, data.size, data.finish)
    const result = await db.insert(productVariants).values({ ...data, modelId }).returning()
    return result[0]

  },

  async update(id: string, data: ProductVariantUpdate, model: string, modelId: string) {
    const updateSlug = generateVariantSlug(model, data.size, data.finish)
    const result = await db.update(productVariants).set({ ...data, modelId }).where(eq(productVariants.id, id)).returning()
    return result[0]
  }

}



