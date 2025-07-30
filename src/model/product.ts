import { asc, eq } from 'drizzle-orm'
import { db } from '../drizzle/db'


import { products, Product, NewProduct, NewProductVariant, productVariants } from '../drizzle/schema'
import { ProductInput } from '../validators/validatorSchema'



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
        productVariant: {
          orderBy: [asc(productVariants.size)],
        }
      }
    })
  },

  async getByID(id: string): Promise<Product | null> {
    const result = await db.select().from(products).where(eq(products.id, id))
    return result[0] || null
  },

  async delete(id: string): Promise<Product | null> {
    const result = await db.delete(products).where(eq(products.id, id)).returning()
    return result[0] || null
  },

  async create(data: ProductInput): Promise<Product> {
    const result = await db.insert(products).values(data).returning()
    return result[0]

  },

  async update(id: string, data: ProductInput) {
    const result = await db.update(products).set(data).where(eq(products.id, id)).returning()
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
  }

}



