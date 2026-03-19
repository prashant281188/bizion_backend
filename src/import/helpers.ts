import { db } from "../config/db"
import { brands, categories, hsnCodes, options, optionValues, units, } from "../db/schema"



import { eq, and } from "drizzle-orm"

export function getSizePosition(size: string) {
  const num = parseInt(size)
  return num // 300, 600, 800 → natural order
}


export function createSku(model: string, size?: string, size_type?: string, finish?: string) {

  let sku = model
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
  return String(value).trim().toLocaleLowerCase()
}


export async function findOrCreateHsn(hsn: string) {
  const existing = await db.query.hsnCodes.findFirst({
    where: eq(hsnCodes.code, hsn)
  })

  if (existing) return existing
  const inserted = await db.insert(hsnCodes).values({
    code: hsn,

  }).returning()

  return inserted[0]
}

export async function findOrCreateBrand(name: string) {

  const existing = await db.query.brands.findFirst({
    where: eq(brands.name, name)
  })

  if (existing) return existing

  const inserted = await db.insert(brands)
    .values({ name })
    .returning()

  return inserted[0]

}


export async function findOrCreateUnit(name: string, symbol: string) {
  const existing = await db.query.units.findFirst({
    where: eq(units.name, name)
  })

  if (existing) return existing

  const inserted = await db.insert(units).values({
    name, symbol
  }).returning()

  return inserted[0]
}

export async function findOrCreateCategory(name: string) {

  const existing = await db.query.categories.findFirst({
    where: eq(categories.name, name)
  })


  if (existing) return existing

  const inserted = await db.insert(categories)
    .values({ name })
    .returning()

  return inserted[0]

}

export async function findOrCreateOption(name: string) {

  const existing = await db.query.options.findFirst({
    where: eq(options.name, name)
  })

  if (existing) return existing

  const inserted = await db.insert(options)
    .values({ name })
    .returning()

  return inserted[0]

}

export async function findOrCreateOptionValue(optionId: string, value: string, position?: number) {

  const existing = await db.query.optionValues.findFirst({
    where: and(
      eq(optionValues.optionId, optionId),
      eq(optionValues.value, value)
    )
  })

  if (existing) return existing

  const inserted = await db.insert(optionValues)
    .values({
      optionId,
      value,
      position
    })
    .returning()

  return inserted[0]

}