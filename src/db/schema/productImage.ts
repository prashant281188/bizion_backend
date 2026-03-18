import { pgTable, text, uuid, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";

export const productImages = pgTable("product_images", {
    id: uuid("id").defaultRandom().primaryKey(),


    path: text("path").notNull(),
    // S3 path

    alt: text("alt"),

    position: integer("position").default(0),

    isPrimary: boolean("is_primary").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

