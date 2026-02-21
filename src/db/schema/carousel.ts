import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const carousel = pgTable(
    "carousel",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        title: text("title"),
        description: text("description"),
        image: text("image"),
        isActive: boolean("is_active").default(true).notNull()
    })