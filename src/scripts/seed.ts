/**
 * Demo Seed — full end-to-end data for showcasing the system.
 *
 * Strategy: insert with onConflictDoNothing(), then re-fetch actual IDs by
 * unique business key before each downstream FK reference. This makes the
 * seed safe to re-run on a database that already has partial data.
 *
 * Run: npm run seed
 */

import { randomUUID as uuid } from "crypto";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import {
  permissions,
  roles,
  rolePermissions,
  users,
  gstGroups,
  gstRates,
  hsnCodes,
  hsnGstHistory,
  units,
  brands,
  categories,
  options,
  optionValues,
  products,
  productVariants,
  variantOptionValues,
  variantRates,
  parties,
  inventory,
  inventoryTransactions,
  orders,
  orderItems,
  purchaseReceipts,
  purchaseReceiptItems,
  purchaseReceiptAllocations,
  dispatches,
  dispatchItems,
  dispatchAllocations,
} from "../db/schema";

const PAST = new Date("2025-01-01T00:00:00Z");

function log(msg: string) { console.log(msg); }

// ─── SEED ────────────────────────────────────────────────────────────────────

async function seed() {
  log("🌱 Starting demo seed...\n");

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  await db.insert(roles).values([
    { id: uuid(), name: "superadmin", isSystem: true  },
    { id: uuid(), name: "manager",   isSystem: false },
    { id: uuid(), name: "salesman",  isSystem: false },
  ]).onConflictDoNothing();

  const roleRows   = await db.select().from(roles);
  const roleByName = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));
  const superadminId = roleByName["superadmin"]!;
  const managerId   = roleByName["manager"]!;
  const salesmanId  = roleByName["salesman"]!;
  log("✅ Roles seeded");

  // ── 2. Permissions ────────────────────────────────────────────────────────
  const RESOURCES = [
    "user", "role", "permission",
    "category", "product", "brand", "carousel", "image",
    "option", "unit", "variant",
    "gst", "hsn",
    "party", "order", "inventory", "dispatch", "purchase_receipt",
    "audit",
  ] as const;
  const ACTIONS = ["create", "read", "update", "delete"] as const;

  await db.insert(permissions).values(
    RESOURCES.flatMap((resource) =>
      ACTIONS.map((action) => ({
        id: uuid(),
        code: `${resource}:${action}`,
        description: `Can ${action} ${resource}`,
      }))
    )
  ).onConflictDoNothing();

  const allPermRows = await db.select().from(permissions);
  const permByCode  = Object.fromEntries(allPermRows.map((p) => [p.code, p.id]));
  log(`✅ ${allPermRows.length} permissions seeded`);

  // Superadmin — everything
  await db.insert(rolePermissions).values(
    allPermRows.map((p) => ({ roleId: superadminId, permissionId: p.id }))
  ).onConflictDoNothing();

  // Manager — everything except user/role/permission
  const managerCodes = RESOURCES
    .filter((r) => !["user", "role", "permission"].includes(r))
    .flatMap((r) => ACTIONS.map((a) => `${r}:${a}`));
  await db.insert(rolePermissions).values(
    managerCodes
      .filter((c) => permByCode[c])
      .map((c) => ({ roleId: managerId, permissionId: permByCode[c]! }))
  ).onConflictDoNothing();

  // Salesman — sales-facing only
  const salesmanCodes = [
    "order:create", "order:read", "order:update",
    "inventory:read",
    "product:read", "variant:read", "category:read", "brand:read",
    "party:read", "party:create",
    "dispatch:read", "dispatch:create",
  ];
  await db.insert(rolePermissions).values(
    salesmanCodes
      .filter((c) => permByCode[c])
      .map((c) => ({ roleId: salesmanId, permissionId: permByCode[c]! }))
  ).onConflictDoNothing();
  log("✅ Role permissions assigned");

  // ── 3. Users ──────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("Demo@1234", 10);

  await db.insert(users).values([
    {
      id: uuid(), firstName: "Prashant", lastName: "Garg",
      email: "admin@bizion.in", phone: "+919999000001",
      password: await bcrypt.hash("Admin@1234", 10),
      roleId: superadminId, emailVerified: true, emailVerifiedAt: PAST, isActive: true,
    },
    {
      id: uuid(), firstName: "Rahul", lastName: "Sharma",
      email: "manager@bizion.in", phone: "+919999000002",
      password: pw,
      roleId: managerId, emailVerified: true, emailVerifiedAt: PAST, isActive: true,
    },
    {
      id: uuid(), firstName: "Amit", lastName: "Verma",
      email: "salesman@bizion.in", phone: "+919999000003",
      password: pw,
      roleId: salesmanId, emailVerified: true, emailVerifiedAt: PAST, isActive: true,
    },
  ]).onConflictDoNothing();

  const userRows   = await db.select().from(users);
  const userByEmail = Object.fromEntries(userRows.map((u) => [u.email, u.id]));
  const managerId2  = userByEmail["manager@bizion.in"]!;
  const salesmanId2 = userByEmail["salesman@bizion.in"]!;
  log("✅ Users seeded  (passwords: Admin@1234 / Demo@1234)");

  // ── 4. GST Groups + Rates ─────────────────────────────────────────────────
  await db.insert(gstGroups).values([
    { id: uuid(), name: "GST 12%" },
    { id: uuid(), name: "GST 18%" },
  ]).onConflictDoNothing();

  const gstGroupRows   = await db.select().from(gstGroups);
  const gstGroupByName = Object.fromEntries(gstGroupRows.map((g) => [g.name, g.id]));
  const gstId12 = gstGroupByName["GST 12%"]!;
  const gstId18 = gstGroupByName["GST 18%"]!;

  await db.insert(gstRates).values([
    { id: uuid(), gstGroupId: gstId12, cgst: "6.00", sgst: "6.00", igst: "12.00", effectiveFrom: PAST },
    { id: uuid(), gstGroupId: gstId18, cgst: "9.00", sgst: "9.00", igst: "18.00", effectiveFrom: PAST },
  ]).onConflictDoNothing();
  log("✅ GST groups + rates seeded");

  // ── 5. HSN Codes + History ────────────────────────────────────────────────
  await db.insert(hsnCodes).values([
    { id: uuid(), hsnCode: "7616", description: "Aluminium articles — door/window fittings" },
    { id: uuid(), hsnCode: "8302", description: "Base metal mountings, fittings, door closers" },
    { id: uuid(), hsnCode: "8301", description: "Padlocks, locks, tower bolts" },
  ]).onConflictDoNothing();

  const hsnRows   = await db.select().from(hsnCodes);
  const hsnByCode = Object.fromEntries(hsnRows.map((h) => [h.hsnCode, h.id]));
  const hsnId7616 = hsnByCode["7616"]!;
  const hsnId8302 = hsnByCode["8302"]!;
  const hsnId8301 = hsnByCode["8301"]!;

  // hsnGstHistory has no unique constraint on (hsnId, gstGroupId) — guard manually
  const existingHsnGst = await db.select().from(hsnGstHistory);
  const hsnGstExists = new Set(existingHsnGst.map((r) => `${r.hsnId}:${r.gstGroupId}`));
  const newHsnGst = [
    { id: uuid(), hsnId: hsnId7616, gstGroupId: gstId18, effectiveFrom: PAST },
    { id: uuid(), hsnId: hsnId8302, gstGroupId: gstId18, effectiveFrom: PAST },
    { id: uuid(), hsnId: hsnId8301, gstGroupId: gstId12, effectiveFrom: PAST },
  ].filter((r) => !hsnGstExists.has(`${r.hsnId}:${r.gstGroupId}`));
  if (newHsnGst.length) await db.insert(hsnGstHistory).values(newHsnGst);
  log("✅ HSN codes + GST history seeded");

  // ── 6. Units ──────────────────────────────────────────────────────────────
  await db.insert(units).values([
    { id: uuid(), unitName: "Pieces", unitSymbol: "PCS" },
    { id: uuid(), unitName: "Box",    unitSymbol: "BOX" },
    { id: uuid(), unitName: "Set",    unitSymbol: "SET" },
  ]).onConflictDoNothing();

  const unitRows   = await db.select().from(units);
  const unitByName = Object.fromEntries(unitRows.map((u) => [u.unitName, u.id]));
  const unitPcsId  = unitByName["Pieces"]!;
  log("✅ Units seeded");

  // ── 7. Brands ─────────────────────────────────────────────────────────────
  await db.insert(brands).values([
    { id: uuid(), brandName: "Flybird", slug: "flybird" },
    { id: uuid(), brandName: "Hini",    slug: "hini" },
  ]).onConflictDoNothing();

  const brandRows   = await db.select().from(brands);
  const brandByName = Object.fromEntries(brandRows.map((b) => [b.brandName, b.id]));
  const flybirdId   = brandByName["Flybird"]!;
  const hiniId      = brandByName["Hini"]!;
  log("✅ Brands seeded");

  // ── 8. Categories ─────────────────────────────────────────────────────────
  await db.insert(categories).values([
    { id: uuid(), categoryName: "Door Handle",    slug: "door-handle",    order: 1 },
    { id: uuid(), categoryName: "Profile Handle", slug: "profile-handle", order: 2 },
    { id: uuid(), categoryName: "Tower Bolt",     slug: "tower-bolt",     order: 3 },
  ]).onConflictDoNothing();

  const catRows   = await db.select().from(categories);
  const catByName = Object.fromEntries(catRows.map((c) => [c.categoryName, c.id]));
  const catDoorId    = catByName["Door Handle"]!;
  const catProfileId = catByName["Profile Handle"]!;
  const catBoltId    = catByName["Tower Bolt"]!;
  log("✅ Categories seeded");

  // ── 9. Options + Values ───────────────────────────────────────────────────
  await db.insert(options).values([
    { id: uuid(), optionName: "Size" },
    { id: uuid(), optionName: "Finish" },
  ]).onConflictDoNothing();

  const optionRows   = await db.select().from(options);
  const optionByName = Object.fromEntries(optionRows.map((o) => [o.optionName, o.id]));
  const optSizeId   = optionByName["Size"]!;
  const optFinishId = optionByName["Finish"]!;

  await db.insert(optionValues).values([
    { id: uuid(), optionId: optSizeId,   optionValue: "S",               position: 1 },
    { id: uuid(), optionId: optSizeId,   optionValue: "M",               position: 2 },
    { id: uuid(), optionId: optSizeId,   optionValue: "L",               position: 3 },
    { id: uuid(), optionId: optFinishId, optionValue: "Stainless Steel", position: 1 },
    { id: uuid(), optionId: optFinishId, optionValue: "Black",           position: 2 },
    { id: uuid(), optionId: optFinishId, optionValue: "Gold",            position: 3 },
  ]).onConflictDoNothing();

  // optionValues has no composite unique — re-fetch by optionId + value
  const ovRows = await db.select().from(optionValues);
  const ovKey  = (optId: string, val: string) => `${optId}:${val}`;
  const ovByKey = Object.fromEntries(ovRows.map((o) => [ovKey(o.optionId, o.optionValue), o.id]));
  const ovS  = ovByKey[ovKey(optSizeId,   "S")]!;
  const ovM  = ovByKey[ovKey(optSizeId,   "M")]!;
  const ovL  = ovByKey[ovKey(optSizeId,   "L")]!;
  const ovSS = ovByKey[ovKey(optFinishId, "Stainless Steel")]!;
  const ovBK = ovByKey[ovKey(optFinishId, "Black")]!;
  log("✅ Options + values seeded");

  // ── 10. Products ──────────────────────────────────────────────────────────
  await db.insert(products).values([
    {
      id: uuid(), model: "DH-1001", slug: "dh-1001-mortise-handle",
      shortDescription: "Mortise door handle — stainless steel",
      brandId: flybirdId, categoryId: catDoorId, hsnId: hsnId8302, unitId: unitPcsId,
      status: "active", isActive: true,
    },
    {
      id: uuid(), model: "DH-2002", slug: "dh-2002-black-lever-handle",
      shortDescription: "Lever door handle — matte black finish",
      brandId: hiniId, categoryId: catDoorId, hsnId: hsnId8302, unitId: unitPcsId,
      status: "active", isActive: true,
    },
    {
      id: uuid(), model: "PH-3001", slug: "ph-3001-aluminum-profile-handle",
      shortDescription: "Aluminum profile handle for sliding doors",
      brandId: flybirdId, categoryId: catProfileId, hsnId: hsnId7616, unitId: unitPcsId,
      status: "active", isActive: true,
    },
    {
      id: uuid(), model: "TB-4001", slug: "tb-4001-tower-bolt",
      shortDescription: "Heavy duty tower bolt",
      brandId: hiniId, categoryId: catBoltId, hsnId: hsnId8301, unitId: unitPcsId,
      status: "active", isActive: true,
    },
  ]).onConflictDoNothing();

  // products unique on (brandId, model)
  const prodRows   = await db.select().from(products);
  const prodByModel = Object.fromEntries(prodRows.map((p) => [p.model, p.id]));
  const prodDH01 = prodByModel["DH-1001"]!;
  const prodDH02 = prodByModel["DH-2002"]!;
  const prodPH01 = prodByModel["PH-3001"]!;
  const prodTB01 = prodByModel["TB-4001"]!;
  log("✅ Products seeded");

  // ── 11. Variants ──────────────────────────────────────────────────────────
  await db.insert(productVariants).values([
    { id: uuid(), productId: prodDH01, sku: "DH1001-S-SS", packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodDH01, sku: "DH1001-M-SS", packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodDH01, sku: "DH1001-L-SS", packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodDH02, sku: "DH2002-S-BK", packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodDH02, sku: "DH2002-M-BK", packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodPH01, sku: "PH3001-SS",   packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodPH01, sku: "PH3001-BK",   packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodTB01, sku: "TB4001-S",    packing: "1", isActive: true, isDeleted: false },
    { id: uuid(), productId: prodTB01, sku: "TB4001-M",    packing: "1", isActive: true, isDeleted: false },
  ]).onConflictDoNothing();

  // variants unique on (sku, productId)
  const varRows  = await db.select().from(productVariants);
  const varBySku = Object.fromEntries(varRows.map((v) => [v.sku!, v.id]));
  const varDH01_S_SS = varBySku["DH1001-S-SS"]!;
  const varDH01_M_SS = varBySku["DH1001-M-SS"]!;
  const varDH01_L_SS = varBySku["DH1001-L-SS"]!;
  const varDH02_S_BK = varBySku["DH2002-S-BK"]!;
  const varDH02_M_BK = varBySku["DH2002-M-BK"]!;
  const varPH01_SS   = varBySku["PH3001-SS"]!;
  const varPH01_BK   = varBySku["PH3001-BK"]!;
  const varTB01_S    = varBySku["TB4001-S"]!;
  const varTB01_M    = varBySku["TB4001-M"]!;
  log("✅ Variants seeded");
  

  // ── 12. Variant ↔ Option Values ───────────────────────────────────────────
  // variantOptionValues has unique on (variantId, optionValueId)
  await db.insert(variantOptionValues).values([
    { id: uuid(), variantId: varDH01_S_SS, optionValueId: ovS  },
    { id: uuid(), variantId: varDH01_S_SS, optionValueId: ovSS },
    { id: uuid(), variantId: varDH01_M_SS, optionValueId: ovM  },
    { id: uuid(), variantId: varDH01_M_SS, optionValueId: ovSS },
    { id: uuid(), variantId: varDH01_L_SS, optionValueId: ovL  },
    { id: uuid(), variantId: varDH01_L_SS, optionValueId: ovSS },
    { id: uuid(), variantId: varDH02_S_BK, optionValueId: ovS  },
    { id: uuid(), variantId: varDH02_S_BK, optionValueId: ovBK },
    { id: uuid(), variantId: varDH02_M_BK, optionValueId: ovM  },
    { id: uuid(), variantId: varDH02_M_BK, optionValueId: ovBK },
    { id: uuid(), variantId: varPH01_SS,   optionValueId: ovSS },
    { id: uuid(), variantId: varPH01_BK,   optionValueId: ovBK },
    { id: uuid(), variantId: varTB01_S,    optionValueId: ovS  },
    { id: uuid(), variantId: varTB01_M,    optionValueId: ovM  },
  ]).onConflictDoNothing();
  log("✅ Variant option values seeded");

  // ── 13. Variant Rates ─────────────────────────────────────────────────────
  // variantRates has no unique constraint — guard manually by checking existing
  const existingRates = await db.select().from(variantRates);
  const ratedVariants = new Set(existingRates.map((r) => r.variantId));
  const newRates = [
    { variantId: varDH01_S_SS, mrp: "850",  purchaseRate: "480", saleRate: "680" },
    { variantId: varDH01_M_SS, mrp: "950",  purchaseRate: "530", saleRate: "760" },
    { variantId: varDH01_L_SS, mrp: "1100", purchaseRate: "620", saleRate: "880" },
    { variantId: varDH02_S_BK, mrp: "720",  purchaseRate: "400", saleRate: "580" },
    { variantId: varDH02_M_BK, mrp: "820",  purchaseRate: "450", saleRate: "660" },
    { variantId: varPH01_SS,   mrp: "1200", purchaseRate: "700", saleRate: "960" },
    { variantId: varPH01_BK,   mrp: "1150", purchaseRate: "680", saleRate: "920" },
    { variantId: varTB01_S,    mrp: "180",  purchaseRate: "90",  saleRate: "140" },
    { variantId: varTB01_M,    mrp: "220",  purchaseRate: "110", saleRate: "170" },
  ].filter((r) => !ratedVariants.has(r.variantId));
  if (newRates.length) {
    await db.insert(variantRates).values(newRates.map((r) => ({ id: uuid(), ...r, from: PAST })));
  }
  log("✅ Variant rates seeded");

  // ── 14. Parties ───────────────────────────────────────────────────────────
  await db.insert(parties).values([
    {
      id: uuid(), name: "Arora Hardware Imports Pvt Ltd", tradeName: "Arora Hardware",
      contactPerson: "Suresh Arora", phone: "9811001100", email: "suresh@arorahardware.com",
      addressLine1: "Plot 12, Sector 5", city: "Ludhiana", state: "Punjab",
      stateCode: "03", pincode: "141001", type: "supplier",
      gstNo: "03AABCA1234B1ZX", gstRegistrationType: "regular", panNo: "AABCA1234B",
      isActive: true,
    },
    {
      id: uuid(), name: "Sharma Sanitary & Hardware", tradeName: "Sharma Hardware",
      contactPerson: "Rakesh Sharma", phone: "9800200300", email: "rakesh@sharmasanitary.com",
      addressLine1: "12/3 Gandhi Nagar", city: "Delhi", state: "Delhi",
      stateCode: "07", pincode: "110031", type: "retailer",
      gstNo: "07BCFPS4567C1ZM", gstRegistrationType: "regular", panNo: "BCFPS4567C",
      isActive: true,
    },
    {
      id: uuid(), name: "Gupta Fittings Store",
      contactPerson: "Mohan Gupta", phone: "9900100200",
      city: "Jaipur", state: "Rajasthan", stateCode: "08", pincode: "302001",
      type: "retailer", gstRegistrationType: "unregistered", isActive: true,
    },
  ]).onConflictDoNothing();

  const partyRows    = await db.select().from(parties);
  const partyByName  = Object.fromEntries(partyRows.map((p) => [p.name, p.id]));
  const supplierAId  = partyByName["Arora Hardware Imports Pvt Ltd"]!;
  const retailerBId  = partyByName["Sharma Sanitary & Hardware"]!;
  log("✅ Parties seeded");

  // ── 15. Inventory — opening stock ─────────────────────────────────────────
  // inventory unique on (variantId, location)
  const openingStock = [
    { variantId: varDH01_S_SS, qty: 120, reorder: 20 },
    { variantId: varDH01_M_SS, qty: 80,  reorder: 20 },
    { variantId: varDH01_L_SS, qty: 60,  reorder: 15 },
    { variantId: varDH02_S_BK, qty: 100, reorder: 20 },
    { variantId: varDH02_M_BK, qty: 90,  reorder: 20 },
    { variantId: varPH01_SS,   qty: 50,  reorder: 10 },
    { variantId: varPH01_BK,   qty: 45,  reorder: 10 },
    { variantId: varTB01_S,    qty: 200, reorder: 50 },
    { variantId: varTB01_M,    qty: 180, reorder: 50 },
  ];

  await db.insert(inventory).values(
    openingStock.map(({ variantId, qty, reorder }) => ({
      id: uuid(),
      variantId,
      location: "default",
      quantityOnHand: qty,
      quantityReserved: 0,
      quantityOrdered: 0,
      quantityToOrder: 0,
      reorderPoint: reorder,
      reorderQty: reorder * 3,
    }))
  ).onConflictDoNothing();

  // inventoryTransactions has no unique constraint — guard by checking existing notes
  const existingTx = await db.select().from(inventoryTransactions);
  const txNotes = new Set(existingTx.map((t) => t.note));
  const newOpeningTx = openingStock
    .filter(({ variantId }) => !txNotes.has(`Opening stock: ${variantId}`))
    .map(({ variantId, qty }) => ({
      id: uuid(), variantId,
      type: "purchase" as const,
      quantity: qty,
      location: "default",
      note: `Opening stock: ${variantId}`,
    }));
  if (newOpeningTx.length) await db.insert(inventoryTransactions).values(newOpeningTx);
  log("✅ Opening inventory seeded");

  // ── 16. Purchase Order ────────────────────────────────────────────────────
  await db.insert(orders).values({
    id: uuid(),
    orderType: "purchase", orderNumber: "PO-2026-0001",
    orderDate: "2026-03-15",
    partyId: supplierAId, salesmanId: managerId2,
    status: "confirmed",
    subTotal: "35000.00", taxAmount: "5820.00", totalAmount: "40820.00",
  }).onConflictDoNothing();

  const poOrderRow = await db.select().from(orders).where(eq(orders.orderNumber, "PO-2026-0001")).limit(1);
  const poOrderId  = poOrderRow[0]!.id;

  const existingPoItems = await db.select().from(orderItems).where(eq(orderItems.orderId, poOrderId));
  if (!existingPoItems.length) {
    const [poItem1Row, poItem2Row] = await db.insert(orderItems).values([
      {
        id: uuid(), orderId: poOrderId, variantId: varDH01_S_SS, sku: "DH1001-S-SS",
        boxQty: 1, packing: "1", orderQty: "50", fulfilledQty: 50,
        mrp: "850.00", rate: "480.00", taxRate: "18.00", taxAmount: "4320.00", amount: "28320.00",
      },
      {
        id: uuid(), orderId: poOrderId, variantId: varTB01_M, sku: "TB4001-M",
        boxQty: 1, packing: "1", orderQty: "100", fulfilledQty: 100,
        mrp: "220.00", rate: "110.00", taxRate: "12.00", taxAmount: "1320.00", amount: "12320.00",
      },
    ]).returning();

    // ── 17. Purchase Receipt ────────────────────────────────────────────────
    const [receiptRow] = await db.insert(purchaseReceipts).values({
      id: uuid(), orderId: poOrderId,
      receivedDate: new Date("2026-03-20"),
      createdBy: managerId2,
      createdAt: new Date("2026-03-20"),
      updatedAt: new Date("2026-03-20"),
    }).returning();

    const [ri1, ri2] = await db.insert(purchaseReceiptItems).values([
      { id: uuid(), receipt_id: receiptRow.id, variant_id: varDH01_S_SS, orderId: poOrderId, totalQty: 50 },
      { id: uuid(), receipt_id: receiptRow.id, variant_id: varTB01_M,    orderId: poOrderId, totalQty: 100 },
    ]).returning();

    await db.insert(purchaseReceiptAllocations).values([
      { id: uuid(), receiptItemId: ri1.id, orderItemId: poItem1Row.id, allocatedQty: 50 },
      { id: uuid(), receiptItemId: ri2.id, orderItemId: poItem2Row.id, allocatedQty: 100 },
    ]);

    await db.insert(inventoryTransactions).values([
      { id: uuid(), variantId: varDH01_S_SS, type: "purchase", quantity: 50,  location: "default", note: `Received via receipt ${receiptRow.id}` },
      { id: uuid(), variantId: varTB01_M,    type: "purchase", quantity: 100, location: "default", note: `Received via receipt ${receiptRow.id}` },
    ]);
    log("✅ Purchase order PO-2026-0001 + receipt seeded");
  } else {
    log("⏭️  Purchase order PO-2026-0001 already seeded — skipped");
  }

  // ── 18. Sale Order + Dispatch ─────────────────────────────────────────────
  await db.insert(orders).values({
    id: uuid(),
    orderType: "sale", orderNumber: "SO-2026-0001",
    orderDate: "2026-04-01",
    partyId: retailerBId, salesmanId: salesmanId2,
    status: "confirmed",
    subTotal: "24000.00", taxAmount: "4320.00", totalAmount: "28320.00",
  }).onConflictDoNothing();

  const soOrderRow = await db.select().from(orders).where(eq(orders.orderNumber, "SO-2026-0001")).limit(1);
  const soOrderId  = soOrderRow[0]!.id;

  const existingSoItems = await db.select().from(orderItems).where(eq(orderItems.orderId, soOrderId));
  if (!existingSoItems.length) {
    const [soItem1, soItem2] = await db.insert(orderItems).values([
      {
        id: uuid(), orderId: soOrderId, variantId: varDH01_M_SS, sku: "DH1001-M-SS",
        boxQty: 1, packing: "1", orderQty: "20", fulfilledQty: 20,
        mrp: "950.00", rate: "760.00", taxRate: "18.00", taxAmount: "2736.00", amount: "17936.00",
      },
      {
        id: uuid(), orderId: soOrderId, variantId: varDH02_S_BK, sku: "DH2002-S-BK",
        boxQty: 1, packing: "1", orderQty: "15", fulfilledQty: 15,
        mrp: "720.00", rate: "580.00", taxRate: "18.00", taxAmount: "1566.00", amount: "10266.00",
      },
    ]).returning();

    // ── 19. Dispatch ────────────────────────────────────────────────────────
    const [disp] = await db.insert(dispatches).values({
      id: uuid(), dispatchNumber: "DISP-2026-0001",
      dispatchedAt: new Date("2026-04-03"), status: "shipped",
      transport: "Shree Maruti Couriers", nop: 2, notes: "Handle with care",
      createdBy: managerId2,
      createdAt: new Date("2026-04-03"), updatedAt: new Date("2026-04-03"),
    }).returning();

    const [di1, di2] = await db.insert(dispatchItems).values([
      { id: uuid(), dispatchId: disp.id, variantId: varDH01_M_SS, totalQty: 20 },
      { id: uuid(), dispatchId: disp.id, variantId: varDH02_S_BK, totalQty: 15 },
    ]).returning();

    await db.insert(dispatchAllocations).values([
      { id: uuid(), dispatchItemId: di1.id, orderItemId: soItem1.id, allocatedQty: 20 },
      { id: uuid(), dispatchItemId: di2.id, orderItemId: soItem2.id, allocatedQty: 15 },
    ]);

    await db.insert(inventoryTransactions).values([
      { id: uuid(), variantId: varDH01_M_SS, type: "sale", quantity: -20, location: "default", note: `Dispatched via ${disp.id} for SO-2026-0001` },
      { id: uuid(), variantId: varDH02_S_BK, type: "sale", quantity: -15, location: "default", note: `Dispatched via ${disp.id} for SO-2026-0001` },
    ]);
    log("✅ Sale order SO-2026-0001 + dispatch DISP-2026-0001 seeded");
  } else {
    log("⏭️  Sale order SO-2026-0001 already seeded — skipped");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log(`
┌─────────────────────────────────────────────────────────┐
│               🎉  Demo seed completed!                  │
├─────────────────────────────────────────────────────────┤
│  Users:                                                 │
│    admin@bizion.in     → Admin@1234  (superadmin)       │
│    manager@bizion.in   → Demo@1234   (manager)          │
│    salesman@bizion.in  → Demo@1234   (salesman)         │
├─────────────────────────────────────────────────────────┤
│  Master data:                                           │
│    2 brands · 3 categories · 4 products · 9 variants    │
│    2 GST groups · 3 HSN codes · 3 units                 │
│    3 parties (1 supplier, 2 retailers)                  │
├─────────────────────────────────────────────────────────┤
│  Transactions:                                          │
│    Opening stock: 9 variants                            │
│    Purchase order PO-2026-0001 (confirmed + received)   │
│    Sale order SO-2026-0001 (confirmed + shipped)        │
└─────────────────────────────────────────────────────────┘
`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
