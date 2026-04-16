/**
 * Product Import Seed
 *
 * Reads products.xlsx and seeds:
 *   options (Finish, Size) → option values
 *   brands → categories → units → HSN codes → GST group/rate
 *   products → product variants → variant rates → variant option values
 *
 * Each row in the spreadsheet = one product variant.
 * Products are grouped by brand + model.
 *
 * Safe to re-run — uses onConflictDoNothing() throughout.
 * Run: npx tsx src/scripts/import/seedProducts.ts
 */

import path from "path";
import { randomUUID as uuid } from "crypto";
import ExcelJS from "exceljs";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import { brands } from "../../db/schema/brand";
import { categories } from "../../db/schema/category";
import { units } from "../../db/schema/unit";
import { hsnCodes } from "../../db/schema/hsnCodes";
import { hsnGstHistory } from "../../db/schema/hsnGstHistory";
import { gstGroups } from "../../db/schema/gstGroup";
import { gstRates } from "../../db/schema/gstRate";
import { options } from "../../db/schema/options";
import { optionValues } from "../../db/schema/optionValues";
import { products } from "../../db/schema/product";
import { productVariants } from "../../db/schema/productVariant";
import { variantRates } from "../../db/schema/variantRates";
import { variantOptionValues } from "../../db/schema/variantOptionValues";

// ─── helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg); }

/** Unwrap ExcelJS cell value — resolves formula results, returns null on errors/empty */
function cellVal(x: any): any {
  if (x === null || x === undefined) return null;
  if (typeof x === "object" && "result" in x) {
    const r = x.result;
    if (r !== null && typeof r === "object" && "error" in r) return null;
    return r;
  }
  return x;
}

const norm      = (s: any)  => String(s ?? "").trim().toLowerCase();
const toTitleWd = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const toSlug    = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

/** Insert rows in batches to stay under Postgres parameter limits */
async function batchInsert(table: any, rows: any[], batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    await db.insert(table).values(rows.slice(i, i + batchSize)).onConflictDoNothing();
  }
}

// ─── parsed row type ──────────────────────────────────────────────────────────

interface Row {
  brand:      string;
  model:      string;
  category:   string;
  finish:     string | null;
  size:       number | null;
  sizeType:   string | null;
  packing:    number | null;
  unitSymbol: string | null;
  metal:      string | null;
  hsnCode:    string | null;
  mrp:        number | null;
  sale:       number | null;
  purchase:   number | null;
  sku:        string | null;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function seedProducts() {
  log("📦 Starting product import seed...\n");

  // ── 1. Parse Excel ────────────────────────────────────────────────────────

  const filePath = path.resolve(__dirname, "data/products.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws   = wb.worksheets[0];
  const rows: Row[] = [];

  ws.eachRow((row, ri) => {
    if (ri === 1) return; // skip header
    const v = row.values as any[];

    const brandRaw    = cellVal(v[1]);
    const modelRaw    = cellVal(v[2]);
    const categoryRaw = cellVal(v[3]);
    if (!brandRaw || !modelRaw || !categoryRaw) return;

    const hsnRaw = cellVal(v[12]);

    // Resolve unit symbol — the unit column (v[9]) may be a #REF! formula;
    // use unit_symbol (v[8]) which is hardcoded text.
    const rawUnitSym = cellVal(v[8]);
    const unitSymbol = rawUnitSym
      ? String(rawUnitSym).trim().toLowerCase().replace(/\.$/, "")
      : null;

    rows.push({
      brand:      String(brandRaw).trim(),
      model:      String(modelRaw).trim().toLowerCase(),
      category:   String(categoryRaw).trim(),
      finish:     cellVal(v[4]) != null ? String(cellVal(v[4])).trim() : null,
      size:       cellVal(v[5]) != null ? Number(cellVal(v[5]))        : null,
      sizeType:   cellVal(v[6]) != null ? String(cellVal(v[6])).trim().toLowerCase() : null,
      packing:    cellVal(v[7]) != null ? Number(cellVal(v[7]))        : null,
      unitSymbol,
      metal:      cellVal(v[10]) != null ? String(cellVal(v[10])).trim() : null,
      hsnCode:    hsnRaw         != null ? String(hsnRaw).trim()         : null,
      mrp:        cellVal(v[15]) != null ? Number(cellVal(v[15]))        : null,
      sale:       cellVal(v[17]) != null ? Number(cellVal(v[17]))        : null,
      purchase:   cellVal(v[18]) != null ? Number(cellVal(v[18]))        : null,
      sku:        cellVal(v[20]) != null ? String(cellVal(v[20])).trim() : null,
    });
  });

  log(`✅ Parsed ${rows.length} rows from Excel\n`);

  // ── 2. Collect unique master-data ─────────────────────────────────────────

  // brand: norm key → display name (title-case)
  const brandMap = new Map<string, string>();
  rows.forEach(r => {
    const key = norm(r.brand);
    if (key && !brandMap.has(key)) brandMap.set(key, toTitleWd(key));
  });

  // category: norm key → display name (title-case)
  const categoryMap = new Map<string, string>();
  rows.forEach(r => {
    const key = norm(r.category);
    if (key && !categoryMap.has(key)) {
      categoryMap.set(key, toTitleWd(key));
    }
  });

  // HSN codes (non-null)
  const hsnSet = new Set<string>();
  rows.forEach(r => { if (r.hsnCode) hsnSet.add(r.hsnCode); });

  // Finish option values (non-null)
  const finishSet = new Set<string>();
  rows.forEach(r => { if (r.finish) finishSet.add(r.finish); });

  // Size option values — stored as plain number strings (sizeType lives on product)
  const sizeSet = new Set<string>();
  rows.forEach(r => { if (r.size != null) sizeSet.add(String(r.size)); });

  log(`   Brands:         ${brandMap.size}`);
  log(`   Categories:     ${categoryMap.size}`);
  log(`   HSN codes:      ${hsnSet.size}`);
  log(`   Finish values:  ${finishSet.size}`);
  log(`   Size values:    ${sizeSet.size}\n`);

  // ── 3. Options ────────────────────────────────────────────────────────────

  await db.insert(options)
    .values([
      { id: uuid(), optionName: "Finish" },
      { id: uuid(), optionName: "Size"   },
    ])
    .onConflictDoNothing();

  const optRows   = await db.select().from(options);
  const optByName = new Map(optRows.map(o => [o.optionName, o.id]));
  const finishOptId = optByName.get("Finish")!;
  const sizeOptId   = optByName.get("Size")!;
  log("✅ Options ensured");

  // ── 4. Option values ──────────────────────────────────────────────────────

  const finishOvInserts = [...finishSet].map((v, i) => ({
    id: uuid(), optionId: finishOptId, optionValue: v, position: i,
  }));
  const sizeOvInserts = [...sizeSet]
    .sort((a, b) => Number(a) - Number(b))
    .map((v, i) => ({
      id: uuid(), optionId: sizeOptId, optionValue: v, position: i,
    }));

  await batchInsert(optionValues, finishOvInserts);
  await batchInsert(optionValues, sizeOvInserts);

  const ovRows  = await db.select().from(optionValues);
  const ovByKey = new Map(ovRows.map(o => [`${o.optionId}:${o.optionValue}`, o.id]));

  log(`✅ Option values seeded  (${finishOvInserts.length} finishes, ${sizeOvInserts.length} sizes)`);

  // ── 5. Brands ─────────────────────────────────────────────────────────────

  await batchInsert(brands, [...brandMap.entries()].map(([, name]) => ({
    id: uuid(), brandName: name, slug: toSlug(name),
  })));

  const brandRows  = await db.select().from(brands);
  const brandByKey = new Map(brandRows.map(b => [norm(b.brandName), b.id]));
  log(`✅ Brands seeded         (${brandMap.size})`);

  // ── 6. Categories ─────────────────────────────────────────────────────────

  await batchInsert(categories, [...categoryMap.entries()].map(([, name], i) => ({
    id: uuid(), categoryName: name, slug: toSlug(name), order: i + 1,
  })));

  const catRows  = await db.select().from(categories);
  const catByKey = new Map(catRows.map(c => [norm(c.categoryName), c.id]));
  log(`✅ Categories seeded     (${categoryMap.size})`);

  // ── 7. Units ──────────────────────────────────────────────────────────────

  await db.insert(units).values([
    { id: uuid(), unitName: "Set",    unitSymbol: "SET" },
    { id: uuid(), unitName: "Pieces", unitSymbol: "PCS" },
  ]).onConflictDoNothing();

  const unitRows   = await db.select().from(units);
  const unitBySym  = new Map(unitRows.map(u => [u.unitSymbol?.toUpperCase() ?? "", u.id]));
  log("✅ Units ensured");

  // ── 8. HSN Codes ──────────────────────────────────────────────────────────

  const hsnDescMap: Record<string, string> = {
    "7604":     "Aluminium bars, rods and profiles",
    "8302":     "Base metal mountings and fittings",
    "83024110": "Door handles and knobs of base metal",
  };

  await batchInsert(hsnCodes, [...hsnSet].map(code => ({
    id: uuid(), hsnCode: code, description: hsnDescMap[code] ?? null,
  })));

  const hsnRows   = await db.select().from(hsnCodes);
  const hsnByCode = new Map(hsnRows.map(h => [h.hsnCode, h.id]));
  log(`✅ HSN codes seeded      (${hsnSet.size})`);

  // ── 9. GST group + rate ───────────────────────────────────────────────────

  await db.insert(gstGroups)
    .values([{ id: uuid(), name: "GST 18%" }])
    .onConflictDoNothing();

  const gstGroupRows = await db.select().from(gstGroups);
  const gst18Id      = gstGroupRows.find(g => g.name === "GST 18%")!.id;

  await db.insert(gstRates)
    .values([{
      id: uuid(), gstGroupId: gst18Id,
      cgst: "9.00", sgst: "9.00", igst: "18.00",
      effectiveFrom: new Date("2017-07-01"),
    }])
    .onConflictDoNothing();

  log("✅ GST 18% group + rate ensured");

  // ── 10. HSN → GST assignments ─────────────────────────────────────────────

  const existingHist = await db.select().from(hsnGstHistory);
  const histExists   = new Set(existingHist.map(r => `${r.hsnId}:${r.gstGroupId}`));

  const histInserts = [...hsnSet]
    .map(code => hsnByCode.get(code))
    .filter((id): id is string => !!id)
    .filter(hsnId => !histExists.has(`${hsnId}:${gst18Id}`))
    .map(hsnId => ({
      id: uuid(), hsnId, gstGroupId: gst18Id,
      effectiveFrom: new Date("2017-07-01"),
    }));

  if (histInserts.length) await db.insert(hsnGstHistory).values(histInserts);
  log("✅ HSN → GST assignments ensured");

  // ── 11. Products ──────────────────────────────────────────────────────────

  // Build unique product map: "brandKey|modelNorm" → product data
  // Take first occurrence for product-level fields (sizeType, metal, hsnCode, unit)
  const productMap = new Map<string, {
    brandKey:    string;
    model:       string;
    categoryKey: string;
    sizeType:    string | null;
    metal:       string | null;
    hsnCode:     string | null;
    unitSymbol:  string | null;
  }>();

  rows.forEach(r => {
    const key = `${norm(r.brand)}|${norm(r.model)}`;
    if (!productMap.has(key)) {
      productMap.set(key, {
        brandKey:    norm(r.brand),
        model:       r.model,
        categoryKey: norm(r.category),
        sizeType:    r.sizeType,
        metal:       r.metal,
        hsnCode:     r.hsnCode,
        unitSymbol:  r.unitSymbol,
      });
    }
  });

  const productInserts = [...productMap.entries()].map(([, p]) => {
    const brandId    = brandByKey.get(p.brandKey) ?? null;
    const categoryId = catByKey.get(p.categoryKey);
    if (!categoryId) return null;

    const hsnId  = p.hsnCode ? (hsnByCode.get(p.hsnCode) ?? null) : null;
    const unitId = p.unitSymbol
      ? (unitBySym.get(p.unitSymbol.toUpperCase()) ?? unitBySym.get("SET") ?? null)
      : null;

    return {
      id:         uuid(),
      model:      p.model,
      metal:      p.metal ?? null,
      slug:       toSlug(`${p.brandKey}-${p.model}`),
      brandId,
      categoryId,
      hsnId,
      unitId,
      sizeType:   p.sizeType,
      status:     "active" as const,
      isActive:   true,
      isFeatured: false,
      isNew:      false,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  await batchInsert(products, productInserts);

  // Fetch all products and build lookup: "brandId|modelNorm" → productId
  const allProducts = await db.select({
    id: products.id, model: products.model, brandId: products.brandId,
  }).from(products);

  // Build reverse map: brandId → norm brand key
  const brandIdToKey = new Map([...brandByKey.entries()].map(([k, id]) => [id, k]));

  const productByKey = new Map<string, string>();
  allProducts.forEach(p => {
    const bKey = p.brandId ? (brandIdToKey.get(p.brandId) ?? "") : "";
    productByKey.set(`${bKey}|${norm(p.model)}`, p.id);
  });

  log(`✅ Products seeded       (${productMap.size})`);

  // ── 12. Variants, rates, and option values ────────────────────────────────

  log(`\n   Inserting ${rows.length} variants...`);

  const BATCH = 300;
  let variantCount = 0;
  let rateCount    = 0;
  let skipped      = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);

    // ── a. Prepare variant inserts ──────────────────────────────────────────
    type VariantInsert = { id: string; productId: string; sku: string | null; packing: string | null; isActive: boolean };

    const variantInserts: VariantInsert[] = [];
    const metaByIdx: {
      productId: string; sku: string | null;
      mrp: number | null; sale: number | null; purchase: number | null;
      finish: string | null; size: string | null;
    }[] = [];

    for (const row of chunk) {
      const key       = `${norm(row.brand)}|${norm(row.model)}`;
      const productId = productByKey.get(key);
      if (!productId) { skipped++; continue; }

      const variantId = uuid();
      variantInserts.push({
        id: variantId, productId,
        sku:     row.sku ?? null,
        packing: row.packing != null ? String(row.packing) : null,
        isActive: true,
      });
      metaByIdx.push({
        productId,
        sku:      row.sku ?? null,
        mrp:      row.mrp,
        sale:     row.sale,
        purchase: row.purchase,
        finish:   row.finish,
        size:     row.size != null ? String(row.size) : null,
      });
    }

    if (!variantInserts.length) continue;

    // ── b. Insert variants ──────────────────────────────────────────────────
    await batchInsert(productVariants, variantInserts);
    variantCount += variantInserts.length;

    // ── c. Re-fetch actual variant IDs for this chunk's products ───────────
    //      (onConflictDoNothing means some rows may already exist with different UUIDs)
    const chunkProductIds = [...new Set(variantInserts.map(v => v.productId))];
    const chunkVariants   = await db.select({
      id: productVariants.id,
      sku: productVariants.sku,
      productId: productVariants.productId,
    }).from(productVariants)
      .where(inArray(productVariants.productId, chunkProductIds));

    // "productId|sku" → actual variantId (for sku-keyed lookup)
    const variantBySku = new Map<string, string>();
    chunkVariants.forEach(v => {
      if (v.sku) variantBySku.set(`${v.productId}|${v.sku}`, v.id);
    });

    // ── d. Find which variants already have an active rate ──────────────────
    const chunkVariantIds    = chunkVariants.map(v => v.id);
    const existingActiveRates = chunkVariantIds.length
      ? await db.select({ variantId: variantRates.variantId })
          .from(variantRates)
          .where(and(
            inArray(variantRates.variantId, chunkVariantIds),
            isNull(variantRates.effectiveTo),
          ))
      : [];
    const hasActiveRate = new Set(existingActiveRates.map(r => r.variantId));

    // ── e. Build rate + option-value inserts ────────────────────────────────
    const rateInserts: {
      id: string; variantId: string;
      mrp: string | null; saleRate: string | null; purchaseRate: string | null;
      effectiveFrom: Date;
    }[] = [];

    const ovInserts: { variantId: string; optionValueId: string }[] = [];

    for (const meta of metaByIdx) {
      // Resolve the actual variant ID (may differ from the uuid we generated if row existed)
      const actualId = meta.sku
        ? (variantBySku.get(`${meta.productId}|${meta.sku}`) ?? null)
        : null;

      if (!actualId) continue;

      // Rate — only when at least one price is present and no active rate exists yet
      const hasPrice = meta.mrp != null || meta.sale != null || meta.purchase != null;
      if (hasPrice && !hasActiveRate.has(actualId)) {
        rateInserts.push({
          id:           uuid(),
          variantId:    actualId,
          mrp:          meta.mrp      != null ? Number(meta.mrp).toFixed(2)      : null,
          saleRate:     meta.sale     != null ? Number(meta.sale).toFixed(2)     : null,
          purchaseRate: meta.purchase != null ? Number(meta.purchase).toFixed(2) : null,
          effectiveFrom: new Date(),
        });
        rateCount++;
      }

      // Option values
      if (meta.finish) {
        const ovId = ovByKey.get(`${finishOptId}:${meta.finish}`);
        if (ovId) ovInserts.push({ variantId: actualId, optionValueId: ovId });
      }
      if (meta.size) {
        const ovId = ovByKey.get(`${sizeOptId}:${meta.size}`);
        if (ovId) ovInserts.push({ variantId: actualId, optionValueId: ovId });
      }
    }

    if (rateInserts.length) {
      await batchInsert(variantRates, rateInserts);
    }
    if (ovInserts.length) {
      await batchInsert(variantOptionValues, ovInserts);
    }

    const processed = Math.min(i + BATCH, rows.length);
    log(`   ... ${processed} / ${rows.length} rows processed`);
  }

  log(`\n✅ Variants seeded:      ${variantCount}`);
  log(`✅ Rates seeded:         ${rateCount}`);
  log(`   (${rows.length - rateCount - skipped} variants have no price in source data)`);
  if (skipped) log(`⚠️  Skipped:             ${skipped} (product lookup failed)`);

  log("\n🎉 Product import complete!\n");
}

seedProducts()
  .then(() => process.exit(0))
  .catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });
