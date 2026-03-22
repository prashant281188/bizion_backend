import { parseExcel } from "./parseExcel"

import {
  products,
  productVariants,
  variantOptionValues,
  variantRates,
  productImages
} from "../db/schema"

import {
  createProductSlug,
  createSku,
  findOrCreateBrand,
  findOrCreateCategory,
  findOrCreateHsn,
  findOrCreateOption,
  findOrCreateOptionValue,
  findOrCreateUnit,
  getSizePosition,
  trimAndLower
} from "./helpers"

import { db } from "../config/db"



export async function importProducts() {

  const rows = parseExcel("src/data/products.xlsx")

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  }

  // 🔥 Cache (performance boost)
  const optionCache = new Map<string, any>()
  const optionValueCache = new Map<string, any>()


  for (let i = 4125; i < 4652; i++) {

    const row = rows[i]

    try {

      await db.transaction(async (tx) => {

        const normalizedModel = trimAndLower(row.model)
        const normalizedBrand = trimAndLower(row.brand)
        const normalizedCategory = trimAndLower(row.category)
        const normalizedUnit = trimAndLower(row.unit)
        const normalizedUnitSymbol = trimAndLower(row.unit_symbol)

        // ✅ Brand & Category
        const brand = await findOrCreateBrand(normalizedBrand)
        const category = await findOrCreateCategory(normalizedCategory)

        let hsn
        let unit
        if (row.hsn) {

          hsn = await findOrCreateHsn(row.hsn!)
        }

        if (row.unit && row.unit_symbol) {

          unit = await findOrCreateUnit(normalizedUnit, normalizedUnitSymbol)
        }




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
              unitId: unit?.id || null,
              hsnId: hsn?.id || null,
              metal: row.metal?.toLowerCase(),
              slug: createProductSlug(normalizedModel, normalizedBrand),
              sizeType: row.size_type
            })
            .returning()

          product = inserted[0]
        }

        // =========================
        // 🔥 OPTIONS + VALUES (CACHED)
        // =========================

        let sizeOption = optionCache.get("size")
        if (!sizeOption) {
          sizeOption = await findOrCreateOption("size")
          optionCache.set("size", sizeOption)
        }

        let finishOption = optionCache.get("finish")
        if (!finishOption) {
          finishOption = await findOrCreateOption("finish")
          optionCache.set("finish", finishOption)
        }

        let sizeValue = null
        let finishValue = null

        if (row.size) {
          const key = `size-${row.size}`
          sizeValue = optionValueCache.get(key)

          if (!sizeValue) {
            sizeValue = await findOrCreateOptionValue(sizeOption.id, row.size, getSizePosition(row.size))
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
              sku: createSku(row.brand, row.model, row.size, row.size_type, row.finish)
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

        const existingRate = await tx.query.variantRates.findFirst({
          where: (r, { eq }) => eq(r.variantId, variantId)
        })

        if (!existingRate) {
          await tx.insert(variantRates).values({
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