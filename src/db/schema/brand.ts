import { relations } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { products } from "./product";

export const brands = pgTable("brands", {
    id: uuid("id").defaultRandom().primaryKey(),
    brandName: text("brand_name").notNull().unique(),
    brandLogo: text("brand_logo")
});


export const brandRelations = relations(brands, ({ many }) => ({
    products: many(products)
}))