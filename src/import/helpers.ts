import { db } from "../config/db"
import { brands, categories, options, optionValues, } from "../db/schema"



import { eq, and } from "drizzle-orm"


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

export async function findOrCreateOptionValue(optionId: string, value: string) {

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
      value
    })
    .returning()

  return inserted[0]

}