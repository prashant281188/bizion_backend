import { pgTable, uuid, text, boolean, timestamp, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

export const partyTypeEnum = pgEnum('party_type', ['retailer', 'supplier', 'customer', 'distributor']);
export const gstRegistrationTypeEnum = pgEnum('gst_registration_type', [
  'regular',        // Regular taxpayer
  'composition',    // Composition scheme (small businesses)
  'unregistered',   // No GST registration
  'consumer',       // End consumer (B2C)
  'sez',            // Special Economic Zone
  'overseas',       // Foreign/overseas party
]);


export const parties = pgTable(
  "parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    tradeName: text("trade_name"),           // Trade name (may differ from legal name)
    contactPerson: text("contact_person"),
    phone: text("phone"),
    altPhone: text("alt_phone"),
    email: text("email"),

    // Address
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    district: text("district"),
    state: text("state"),                    // Indian state name
    stateCode: text("state_code"),           // 2-digit GST state code (e.g. "27" for Maharashtra)
    pincode: text("pincode"),
    country: text("country").default("India"),

    // Party classification
    type: partyTypeEnum('party_type').notNull().default("retailer"),

    // GST fields
    gstNo: text("gst_no"),                          // 15-digit GSTIN
    gstRegistrationType: gstRegistrationTypeEnum('gst_registration_type').default("unregistered"),
    panNo: text("pan_no"),                           // PAN (embedded in GSTIN but useful standalone)
    isRcmApplicable: boolean("is_rcm_applicable").default(false).notNull(), // Reverse Charge Mechanism

    // Banking
    bankName: text("bank_name"),
    bankAccountNo: text("bank_account_no"),
    bankIfsc: text("bank_ifsc"),
    bankBranch: text("bank_branch"),

    // E-commerce
    ecomGstin: text("ecom_gstin"),                  // GSTIN of e-commerce operator if applicable

    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("parties_name_idx").on(table.name),
    index("parties_phone_idx").on(table.phone),
    index("parties_type_idx").on(table.type),
    index("parties_state_code_idx").on(table.stateCode),
    index("parties_gst_reg_type_idx").on(table.gstRegistrationType),
    uniqueIndex("parties_gst_idx").on(table.gstNo),
    uniqueIndex("parties_pan_idx").on(table.panNo),
  ]
);

