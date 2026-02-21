import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    logo: text("logo")
});
