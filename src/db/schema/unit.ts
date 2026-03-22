import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { products } from "./product";


export const units = pgTable("units", {
    id: uuid("id").defaultRandom().primaryKey(),
    unitName: text("unit_name").notNull().unique(),
    unitSymbol: text("unit_symbol").unique()
})

export const unitRelations = relations(units,({many})=>({
    products: many(products)
}))