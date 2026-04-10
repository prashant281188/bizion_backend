import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const carousel = pgTable(
    "carousel",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        title: text("title"),
        description: text("description"),
        image: text("image"),
        linkUrl: text("link_url"),
        order: integer("order").default(0).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    },
    (table) => [index("carousel_order_idx").on(table.order)
    ])