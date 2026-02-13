import { db } from '../config/db'
import { categories, hsns, products, productVariants, units } from '../models/schema'


type SizeType = "mm" | "inch" | "pin" |"na"


type Product = {
  model: string,
  manufacture?: string | null,
  metal?: string | null,
  brand?: string | null,
  hsnId: string,
  categoryId: string,
  subCategoryId?: string | null,
  unitId: string,
  variants?: {
    finish?: string,
    size?: string,
    packing?: string,
    sizeType?: SizeType,

    rate?: {
      mrp?: string,
      salePrice?: string,
      purchasePrice?: string,
      saleDiscount?: string,
      purchaseDiscount?: string,
    }
  }[]
}


type BulkProduct = {
  model: string,
  manufacture?: string,
  metal?: string,
  brand?: string,
  hsn: string,
  unit: string,
  category: string,
  subCategory?: string,
  size?: string,
  sizeType?: SizeType,
  finish?: string,
  packing?: string,
  mrp?: string,
  salePrice?: string,
  purchasePrice?: string,
  saleDiscount?: string,
  purchaseDiscount?: string,
  fromDate?: string,
  toDate?: string,
}

function normalizeSizeType(value?: string): SizeType {
  if (value === "inch") return "inch";
  if (value === "pin") return "pin";
  if (value === "mm") return "mm";
  return "na"; // default
}


async function resolveMasterMappings() {
  const [categoryRows, unitRows, hsnRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(units),
    db.select().from(hsns)
  ])
  const categoryMap = new Map(categoryRows.map(c => [c.name.toLowerCase(), c.id]))
  const unitMap = new Map(unitRows.map(u => [u.name.toLowerCase(), u.id]))
  const hsnMap = new Map(hsnRows.map(h => [h.code.toLowerCase(), h.id]))

  return { categoryMap, unitMap, hsnMap }
}

async function ensureCategory(name: string, categoryMap: Map<string, string>) {
  const key = name.toLowerCase();
  if (categoryMap.has(key)) return categoryMap.get(key)!

  const [inserted] = await db.insert(categories).values({
    name
  }).returning();
  categoryMap.set(key, inserted.id)

  return inserted.id
}

async function ensureHsn(code: string, hsnMap: Map<string, string>) {
  const key = code.toLowerCase();
  if (hsnMap.has(key)) return hsnMap.get(key)!

  const [inserted] = await db.insert(hsns).values({
    code
  }).returning();
  hsnMap.set(key, inserted.id)

  return inserted.id
}

async function ensureUnit(name: string, unitMap: Map<string, string>) {
  const key = name.toLowerCase();
  if (unitMap.has(key)) return unitMap.get(key)!;

  const [inserted] = await db.insert(units).values({ name, symbol: "" }).returning();
  unitMap.set(key, inserted.id);
  return inserted.id;
}

export async function transformBulkProducts(bulkProducts: BulkProduct[]) {
  const { categoryMap, hsnMap, unitMap } = await resolveMasterMappings();

  const grouped = new Map<string, Product>();

  for (const item of bulkProducts) {

    const categoryId = await ensureCategory(item.category, categoryMap)
    const hsnId = await ensureHsn(item.hsn, hsnMap)
    const unitId = await ensureUnit(item.unit, unitMap)

    const key = `${item.model}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        model: item.model,
        categoryId,
        unitId,
        hsnId,
        subCategoryId: item.subCategory ?? null,
        metal: item.metal,
        brand: item.brand,
        manufacture: item.manufacture,
        variants: []

      })
    }

    const product = grouped.get(key)!

      const isValidVariant =
      (item.size?.trim() ||
       item.finish?.trim() ||
       item.packing?.trim() ||
       Number(item.mrp) > 0 ||
       Number(item.salePrice) > 0 ||
       Number(item.purchasePrice) > 0);

    if (!isValidVariant) {
      continue; // ⏩ skip this row
    }

    product.variants?.push({
      finish: item.finish,
      size: item.size,
      packing: item.packing,
      sizeType: normalizeSizeType(item.sizeType),
      rate: {
        mrp: item.mrp,
        salePrice: item.salePrice,
        saleDiscount: item.saleDiscount,
        purchaseDiscount: item.purchaseDiscount,
        purchasePrice: item.purchasePrice

      }
    })
  }

  return Array.from(grouped.values())
}