
import { parseExcel } from "./parseExcel"

import {
  products,
  productVariants,
  variantOptionValues,
  productRates,
  productImages
} from "../db/schema"

import {
  findOrCreateBrand,
  findOrCreateCategory,
  findOrCreateOption,
  findOrCreateOptionValue
} from "./helpers"
import { db } from "../config/db"

export async function importProducts() {

  const rows: any[] = parseExcel("src/data/products.xlsx")

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  }

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i]


    try {

      await db.transaction(async (tx) => {

        const brand = await findOrCreateBrand(row.brand)

        const category = await findOrCreateCategory(row.category)

        let product = await tx.query.products.findFirst({
          where: (p, { eq }) => eq(p.model, String(row.model).trim().toLocaleLowerCase())
        })

        if (product) {
          await tx.update(products).set({
            metal: row.metal
          })
        }

        if (!product) {

          const inserted = await tx.insert(products)
            .values({
              model: String(row.model).trim().toLocaleLowerCase(),
              brandId: brand.id,
              categoryId: category.id,
              metal: String(row.metal).trim().toLocaleLowerCase()
            })
            .returning()

          product = inserted[0]

        }
        

        const sizeOption = await findOrCreateOption("Size")
        const finishOption = await findOrCreateOption("Finish")

        const sizeValue = await findOrCreateOptionValue(
          sizeOption.id,
          row.size
        )

        const finishValue = await findOrCreateOptionValue(
          finishOption.id,
          row.finish
        )

        const variant = await tx.insert(productVariants)
          .values({
            productId: product.id,
            packing: row.packing,
            sku: `${row.model}-${row.size}${row.size_type}-${row.finish}`.trim().toLocaleLowerCase()
          })
          .returning()

        const variantId = variant[0].id

        await tx.insert(variantOptionValues).values([
          {
            variantId,
            optionValueId: sizeValue.id
          },
          {
            variantId,
            optionValueId: finishValue.id
          }
        ])

        await tx.insert(productRates).values({
          variantId,
          mrp: row.mrp,
          saleRate: row.sale_rate,
          purchaseRate: row.purchase_rate
        })

        await tx.insert(productImages).values({
          productId: product.id,
          path: `products/${String(row.brand).trim().toLocaleLowerCase()}/${String(row.model).trim().toLocaleLowerCase()}.jpg`,
          isPrimary: true
        })

      })

      results.success++

      console.log(`✔ Row ${i + 1} imported`)

    } catch (error: any) {

      results.failed++

      results.errors.push({
        rowNumber: i + 1,
        row,
        error: error.message
      })

      console.error(`✖ Row ${i + 1} failed:`, error.message)

    }

  }

  return results

}