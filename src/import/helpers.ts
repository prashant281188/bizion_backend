import { db } from "../config/db"
import { brands, categories, hsnCodes, options, optionValues, units, } from "../db/schema"



import { eq, and } from "drizzle-orm"

export function getSizePosition(size: string) {
  const num = parseInt(size)
  return num // 300, 600, 800 → natural order
}


export function createSku(brand: string, model: string, size?: string, size_type?: string, finish?: string) {

  let sku = brand + " " + model
  if (size) {
    sku = sku + " " + size
  }
  if (size_type) {
    sku = sku + "" + size_type
  }
  if (finish) {
    sku = sku + " " + finish.replace(" ", "-")
  }
  return trimAndLower(sku)
}

export function trimAndLower(value: string) {
  if(!value) return ""
  return String(value).trim().toLocaleLowerCase()
}


export async function findOrCreateHsn(hsn: string) {
  const existing = await db.query.hsnCodes.findFirst({
    where: eq(hsnCodes.hsnCode, hsn)
  })

  if (existing) return existing
  const inserted = await db.insert(hsnCodes).values({
    hsnCode: hsn,

  }).returning()

  return inserted[0]
}

export async function findOrCreateBrand(name: string) {

  const existing = await db.query.brands.findFirst({
    where: eq(brands.brandName, name)
  })

  if (existing) return existing

  const inserted = await db.insert(brands)
    .values({ brandName: name })
    .returning()

  return inserted[0]

}

export function createProductSlug(model: string, brand: string) {
  return trimAndLower(brand.replace(" ", "-")) + "-" + trimAndLower(model.replace(" ", "-"))
}

export async function findOrCreateUnit(name: string, symbol: string) {
  const existing = await db.query.units.findFirst({
    where: eq(units.unitName, name)
  })

  if (existing) return existing

  const inserted = await db.insert(units).values({
    unitName: name, unitSymbol: symbol
  }).returning().onConflictDoNothing()

  return inserted[0]
}

export async function findOrCreateCategory(name: string) {

  const existing = await db.query.categories.findFirst({
    where: eq(categories.categoryName, name)
  })


  if (existing) return existing

  const inserted = await db.insert(categories)
    .values({ categoryName: name })
    .returning()

  return inserted[0]

}

export async function findOrCreateOption(name: string) {

  const existing = await db.query.options.findFirst({
    where: eq(options.optionName, name)
  })

  if (existing) return existing

  const inserted = await db.insert(options)
    .values({ optionName: name })
    .returning()

  return inserted[0]

}

export async function findOrCreateOptionValue(optionId: string, value: string, position?: number) {

  const existing = await db.query.optionValues.findFirst({
    where: and(
      eq(optionValues.optionId, optionId),
      eq(optionValues.optionValue, value)
    )
  })

  if (existing) return existing

  const inserted = await db.insert(optionValues)
    .values({
      optionId,
      optionValue: value,
      position
    })
    .returning()

  return inserted[0]

}