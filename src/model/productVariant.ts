import { eq } from 'drizzle-orm'
import { db } from '../db/db'


import { productVariants, ProductVariant } from '../schema/schema'
import { ProductVariantInput } from '../validators/validatorSchema'



export const productVariantModel =
{
  async getAll() {
    return await db.query.productVariants.findMany()
  },

  async getByID(id: string): Promise<ProductVariant> {
    return (await db.select().from(productVariants).where(eq(productVariants.id, id)))[0]
  },

  async delete(id: string): Promise<ProductVariant | null> {
    return (await db.delete(productVariants).where(eq(productVariants.id, id)).returning())[0]
  },

  async create(data: ProductVariantInput): Promise<ProductVariant> {
    const result = await db.insert(productVariants).values(data).returning()
    return result[0]

  },

  async update(id: string, data: ProductVariantInput) {
    const result = await db.update(productVariants).set(data).where(eq(productVariants.id, id)).returning()
    return result[0]
  }

}



