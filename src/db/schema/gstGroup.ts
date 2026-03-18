// db/schema/gstGroup.ts

import { relations } from "drizzle-orm";
import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp
} from "drizzle-orm/pg-core";
import { gstRates } from "./gstRate";
import { hsnGstHistory } from "./hsnGstHistory";

export const gstGroups = pgTable("gst_groups", {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 50 }).notNull().unique(), // GST 18%

    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow(),
});

export const gstGroupRelations = relations(gstGroups, ({ many }) => ({
    rates: many(gstRates),
    hsnMappings: many(hsnGstHistory),
}));