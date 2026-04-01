import { pgTable, uuid, text, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const partyTypeEnum = pgEnum('party_type', ['retailer', 'supplier', 'customer', 'distributor'])

export const parties = pgTable(
  "parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    type: partyTypeEnum('party_type').notNull().default("retailer"),
    gstNo: text("gst_no"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("parties_name_idx").on(table.name)]
);

