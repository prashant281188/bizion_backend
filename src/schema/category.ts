import { sql } from "drizzle-orm";
import { pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { z } from "zod"

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryName: varchar("categoryName", { length: 100 }).notNull().unique(),
  categoryDescription: varchar("categoryDescription", { length: 100 }),
},
  (table) => [
     uniqueIndex("categories_category_name_ci_idx").on(
      sql`lower(${table.categoryName})`
    ),
  ]
);

export const categorySchema = z.object({
  categoryName: z.string().min(4, { message: "categroy name must be 4 characters long" }),
  categoryDescription: z.string().nullable().optional()
})

export const categoryUpdateSchema = categorySchema.partial().extend({
  id: z.string().uuid()
})

export type Category = z.infer<typeof categorySchema>
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>
export type CategoryRecord = Category & {
  id: string
}