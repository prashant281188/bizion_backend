import { parseExcel } from "./parseExcel"

import {
  products,
  productVariants,
  variantOptionValues,
  productRates,
  productImages
} from "../db/schema"

import {
  createSku,
  findOrCreateBrand,
  findOrCreateCategory,
  findOrCreateOption,
  findOrCreateOptionValue,
  trimAndLower
} from "./helpers"

import { db } from "../config/db"

type productData = {
  model: string
  brand: string
  category: string
  size?: string
  size_type?: string
  finish?: string
  packing: number
  unit: string
  metal?: string
  manufacure?: string
  mrp?: string
  purchase?: string
  sale?: string
}

export async function importProducts() {

  const rows: productData[] = parseExcel("src/data/products.xlsx")

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  }

  // 🔥 Cache (performance boost)
  const optionCache = new Map<string, any>()
  const optionValueCache = new Map<string, any>()

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i]

    try {

      await db.transaction(async (tx) => {

        const normalizedModel = trimAndLower(row.model)
        const normalizedBrand = trimAndLower(row.brand)
        const normalizedCategory = trimAndLower(row.category)

        // ✅ Brand & Category
        const brand = await findOrCreateBrand(normalizedBrand)
        const category = await findOrCreateCategory(normalizedCategory)

        // ✅ Find or Create Product
        let product = await tx.query.products.findFirst({
          where: (p, { eq }) => eq(p.model, normalizedModel)
        })

        if (!product) {

          const image = await tx.insert(productImages).values({
            path: `products/${normalizedBrand}/${normalizedModel}.jpg`,
            alt: normalizedModel,
            isPrimary: true
          }).returning()

          const inserted = await tx.insert(products)
            .values({
              model: normalizedModel,
              imageId: image[0].id,
              brandId: brand.id,
              categoryId: category.id,
              metal: row.metal?.toLowerCase()
            })
            .returning()

          product = inserted[0]
        }

        // =========================
        // 🔥 OPTIONS + VALUES (CACHED)
        // =========================

        let sizeOption = optionCache.get("size")
        if (!sizeOption) {
          sizeOption = await findOrCreateOption("Size")
          optionCache.set("size", sizeOption)
        }

        let finishOption = optionCache.get("finish")
        if (!finishOption) {
          finishOption = await findOrCreateOption("Finish")
          optionCache.set("finish", finishOption)
        }

        let sizeValue = null
        let finishValue = null

        if (row.size) {
          const key = `size-${row.size}`
          sizeValue = optionValueCache.get(key)

          if (!sizeValue) {
            sizeValue = await findOrCreateOptionValue(sizeOption.id, row.size)
            optionValueCache.set(key, sizeValue)
          }
        }

        if (row.finish) {
          const key = `finish-${row.finish}`
          finishValue = optionValueCache.get(key)

          if (!finishValue) {
            finishValue = await findOrCreateOptionValue(finishOption.id, row.finish)
            optionValueCache.set(key, finishValue)
          }
        }

        const optionValueIds = [
          sizeValue?.id,
          finishValue?.id
        ].filter(Boolean) as string[]

        // =========================
        // 🔥 CHECK EXISTING VARIANT
        // =========================

        let existingVariant = null

        const variants = await tx.query.productVariants.findMany({
          where: (v, { eq }) => eq(v.productId, product.id),
          with: {
            optionValues: true
          }
        })

        existingVariant = variants.find(v => {
          const existingIds = v.optionValues.map(ov => ov.optionValueId).sort()
          const incomingIds = [...optionValueIds].sort()
          return JSON.stringify(existingIds) === JSON.stringify(incomingIds)
        })

        let variantId: string

        // =========================
        // 🔥 INSERT VARIANT IF MISSING
        // =========================

        if (existingVariant) {

          variantId = existingVariant.id
          console.log(`⚠ Row ${i + 1}: Variant exists → skipped`)

        } else {

          const variant = await tx.insert(productVariants)
            .values({
              productId: product.id,
              packing: row.packing,
              sku: createSku(row.model, row.size, row.size_type, row.finish)
            })
            .returning()

          variantId = variant[0].id

          if (optionValueIds.length > 0) {
            await tx.insert(variantOptionValues).values(
              optionValueIds.map(id => ({
                variantId,
                optionValueId: id
              }))
            )
          }

          console.log(`✅ Row ${i + 1}: Variant created`)
        }

        // =========================
        // 🔥 INSERT RATE (IF NOT EXISTS)
        // =========================

        const existingRate = await tx.query.productRates.findFirst({
          where: (r, { eq }) => eq(r.variantId, variantId)
        })

        if (!existingRate) {
          await tx.insert(productRates).values({
            variantId,
            mrp: row.mrp,
            saleRate: row.sale,
            purchaseRate: row.purchase
          })
        }

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