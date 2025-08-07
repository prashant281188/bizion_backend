import { asc, eq } from 'drizzle-orm'
import { db } from '../db/db'


import { products, Product, NewProduct, NewProductVariant, productVariants, ProductInput, ProductUpdateInput } from '../schema/schema'



export const Model =
{
  async getAll() {
    return await db.query.products.findMany({
      with: {
        hsn: {
          columns: { hsnCode: true }
        },
        category: {
          columns: { categoryName: true }
        },
        tax: true,
        unit: true,
        variants: {
          orderBy: [asc(productVariants.size)],
        },


      },
      orderBy: [asc(products.model)]
    })
  },

  async getByID(id: string) {
    const result = await db.query.products.findMany({
      where: eq(products.id, id),
      with: {
        hsn: {
          columns: { hsnCode: true }
        },
        category: {
          columns: { categoryName: true }
        },
        tax: true,
        unit: true,
        variants: {
          orderBy: [asc(productVariants.size)],
        }
      }
    })
    return result[0]
  },

  async delete(id: string): Promise<Product | null> {
    const result = await db.delete(products).where(eq(products.id, id)).returning()
    return result[0] || null
  },

  async create(data: ProductInput): Promise<Product> {
    const result = await db.insert(products).values(data).returning()
    return result[0]

  },

  async update(data: ProductUpdateInput) {
    const result = await db.update(products).set(data).where(eq(products.id, data.id)).returning()
    return result[0]
  },

  async createProductWithVariants(productData: NewProduct & { variants: Omit<NewProductVariant, "modelId">[] }) {
    return await db.transaction(async (tx) => {
      const [newProduct] = await tx.insert(products).values(productData).returning();

      const variantData = productData.variants.map((v) => ({
        ...v,
        modelId: newProduct.id,
      }));

      await tx.insert(productVariants).values(variantData);
      return newProduct;
    })
  },

  async updateProductVariants(id: string, productData: ProductUpdateInput) {
    return await db.transaction(async (tx) => {
      productData.variants.map((v) => {
        if (!!v.productId)
          tx.update(productVariants).set(v).where(eq(productVariants.modelId, v.productId))
      })
      return await tx.update(products).set(productData).where(eq(products.id, id));
    })
  }

}



