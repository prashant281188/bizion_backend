import { asc, eq } from 'drizzle-orm'
import { db } from '../db/db'


import { generateVariantSlug, productImages, products, ProductUpdate, productVariants, ProductWithVariantInput, ProductWithVariantUpdate } from '../schema/schema'

export const productModel =
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
        images: true,
        variants: {
          orderBy: [asc(productVariants.size)],
        },
      },
      orderBy: [asc(products.model)]
    })
  },

  async getByModel(model: string) {
    return await db.query.products.findFirst({
      where: (eq(products.model, model))
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

  async delete(id: string) {
    const result = await db.delete(products).where(eq(products.id, id)).returning()
    return result[0] || null
  },

  async create(data: ProductWithVariantInput) {
    const result = await db.insert(products).values(data).returning()
    return result[0]
  },

  async update(data: ProductWithVariantUpdate) {
    const result = await db.update(products).set(data).where(eq(products.id, data.id)).returning()
    return result[0]
  },

  async createProductWithVariants(productData: ProductWithVariantInput, files: Express.Multer.File[]) {
    return await db.transaction(async (tx) => {
      const [newProduct] = await tx.insert(products).values(productData).returning();
      const variantData = productData.variants.map((v) => ({
        ...v,
        // slug: generateVariantSlug(productData.model, v.size, v.finish),
        modelId: newProduct.id,
      }));

      if (files) {
        files.map(async (file) => {
          await tx.insert(productImages).values({ modelId: newProduct.id, path: file.filename })
        })
      }
      await tx.insert(productVariants).values(variantData);
      return newProduct;
    })
  },

  async updateProductWithVariants(productData: ProductWithVariantUpdate, files: Express.Multer.File[]) {
    return db.transaction(async (tx) => {
      // First update product
      const [updatedProduct] = await tx
        .update(products)
        .set(productData)
        .where(eq(products.id, productData.id))
        .returning();

      // Then update/insert variants
      for (const v of productData.variants || []) {
        if ("id" in v && v.id) {
          await tx.update(productVariants).set(v).where(eq(productVariants.id, v.id));
        } else {
          await tx.insert(productVariants).values({
            ...v,
            modelId: productData.id,
          });
        }
      }

      if (files) {
        files.map(async (file) => {
          await tx.insert(productImages).values({ modelId: updatedProduct.id, path: file.filename })
        })
      }

      return updatedProduct;
    });
  },

}



