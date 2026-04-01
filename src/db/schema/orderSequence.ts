import { index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { orderTypeEnum } from "./order";

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
export const orderSequences = pgTable("order_sequences", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderType: orderTypeEnum("order_type").notNull(),

  financialYear: text("financial_year").notNull(),

  lastNumber: numeric("last_number").notNull().default("0"),
}, (table) => [
  index("order_seq_unique_idx").on(table.orderType, table.financialYear),
]);

import { eq, sql } from "drizzle-orm";
import { db } from "../../config/db";

async function getNextOrderNumber(tx:DbOrTx, orderType: "sale" | "purchase") {
  // Lock row FOR UPDATE
  const result = await tx.execute(sql`
    UPDATE order_sequences
    SET last_number = last_number + 1
    WHERE order_type = ${orderType}
    RETURNING last_number;
  `);

  const nextNumber = Number(result[0].last_number);

  const prefix = orderType === "sale" ? "SAL" : "PUR";

  return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
}

function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

