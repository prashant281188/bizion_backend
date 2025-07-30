
import { relations } from 'drizzle-orm';
import { pgTable, varchar, uuid, numeric } from 'drizzle-orm/pg-core'

// -------------------------------------------------------CATEGORY---------------------------------------------------------------//

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryName: varchar("categoryName", { length: 100 }).notNull().unique(),
  categoryDescription: varchar("categoryDescription", { length: 100 }),
});

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

// -------------------------------------------------------HSN---------------------------------------------------------------//

export const hsns = pgTable("hsns", {
  id: uuid().primaryKey().defaultRandom(),
  hsnCode: numeric({ mode: "number" }).notNull(),
  hsnDescription: varchar().default("").notNull()
})

export type HSN = typeof hsns.$inferSelect
export type NewHSN = typeof hsns.$inferInsert


// -------------------------------------------------------UNITS---------------------------------------------------------------//

export const units = pgTable("units", {
  id: uuid().primaryKey().defaultRandom(),
  unitShortName: varchar().notNull(),
  unitLongName: varchar().notNull()
})

export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
// -------------------------------------------------------TAX---------------------------------------------------------------//

export const taxes = pgTable("taxes", {
  id: uuid().primaryKey().defaultRandom(),
  taxValue: numeric({ mode: "number" }).notNull(),
  taxName: varchar().default("").notNull()
})

export type Tax = typeof taxes.$inferSelect
export type NewTax = typeof taxes.$inferInsert

// -------------------------------------------------------GROUP--------------------------------------------------------------//

export const groups = pgTable("groups", {
  id: uuid().primaryKey().defaultRandom(),
  groupName: varchar().unique().notNull(),
  groupDescription: varchar()
})

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert

// -------------------------------------------------------PRODUCT------------------------------------------------------------//

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().unique(),
  manufacture: varchar(),
  brand: varchar(),
  hsnId: uuid().notNull(),
  categoryId: uuid(),
  taxId: uuid(),
  unitId: uuid(),
  metal: varchar(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert


// -------------------------------------------------------PRODUCT VARIANTS------------------------------------------------------------//

export const productVariants = pgTable("productVariants", {
  id: uuid().primaryKey().defaultRandom(),
  modelId: uuid(),
  size: varchar(),
  finish: varchar(),
  boxQty: numeric({ mode: "number", precision: 2 }),
  mrp: numeric({ mode: "number" }),
  purchaseDiscount: numeric({ mode: "number" }),
  purchaseRate: numeric({ mode: "number" }),
  saleDiscount: numeric({ mode: "number" }),
  saleRate: numeric({ mode: "number" }),
})

export type ProductVariant = typeof productVariants.$inferSelect
export type NewProductVariant = typeof productVariants.$inferInsert


// --------------------------------------------------------PRODUCT RELATIONSHIPS----------------------------------------------------------------//


export const hsnRelations = relations(hsns, ({ many }) => ({
  products: many(products)
}))

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(products)
}))

export const taxRelations = relations(taxes, ({ many }) => ({
  products: many(products)
}))

export const unitRelations = relations(units, ({ many }) => ({
  products: many(products)
}))


export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  hsn: one(hsns, {
    fields: [products.hsnId],
    references: [hsns.id]
  }),
  tax: one(taxes, {
    fields: [products.taxId],
    references: [taxes.id]
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id]
  }),
  productVariant: many(productVariants)
}))


export const productVariantRelation = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.modelId],
    references: [products.id]
  })
}))

// ---------------------------------------------------------------------------------------------------------------------------//


// ---------------------------------------------------------------------------TRANSPORT------------------------------------------------------------//

export const transports = pgTable("transports", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar(),
  gstin: varchar(),
  contact: varchar()
})

export type Transport = typeof transports.$inferSelect
export type NewTransport = typeof transports.$inferInsert


// -------------------------------------------------------------------PARTY------------------------------------------------------------------------//

export const parties = pgTable("parties", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar(),
  gstin: varchar(),
  contact: varchar(),
  addressLine1: varchar(),
  addressLine2: varchar(),
  city: varchar(),
  state: varchar(),
  pincode:numeric({mode:"number"}),
  groupId: uuid(),
  transportId: uuid(),
})

export type Party = typeof parties.$inferSelect
export type NewParty = typeof parties.$inferInsert

// -----------------------------------------------------------PARTY & TRASNPORT RELATIONS-----------------------------------------------------------//

export const partyRelation = relations(parties, ({ one }) => ({
  transport: one(transports, {
    fields: [parties.transportId],
    references: [transports.id]
  }),
  group: one(groups, {
    fields: [parties.groupId],
    references: [groups.id]
  })
}))

export const trasnportRelation = relations(transports, ({ many }) => ({
  parties: many(parties),
}))

// --------------------------------------------------------------------------------------------------------------------------------------------------//