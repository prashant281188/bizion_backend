import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const businessTypeEnum = pgEnum("business_type", [
  "sole_proprietorship",   // Single owner, no separate legal entity
  "partnership",           // Registered under Partnership Act 1932
  "llp",                   // Limited Liability Partnership
  "private_limited",       // Pvt. Ltd. under Companies Act 2013
  "public_limited",        // Public Ltd. under Companies Act 2013
  "one_person_company",    // OPC under Companies Act 2013
  "huf",                   // Hindu Undivided Family
  "trust",
  "society",
  "ngo",
  "government",
  "other",
]);

export const gstRegistrationTypeEnum2 = pgEnum("business_gst_reg_type", [
  "regular",        // Regular taxpayer with full ITC
  "composition",    // Composition scheme — quarterly filing, no ITC
  "unregistered",   // Below threshold / voluntary non-registration
  "sez_unit",       // SEZ unit — zero-rated supply
  "sez_developer",  // SEZ developer
]);

export const financialYearStartEnum = pgEnum("financial_year_start_month", [
  "april",    // Default for India (April – March)
  "january",  // For entities following calendar year
]);

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "current",   // For businesses
  "savings",
  "cc",        // Cash Credit
  "od",        // Overdraft
]);

// ─── Table ────────────────────────────────────────────────────────────────────

export const businessDetails = pgTable(
  "business_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // ── Core identity ────────────────────────────────────────────────────────
    legalName: text("legal_name").notNull(),              // Name as per PAN / MCA
    tradeName: text("trade_name"),                        // Display / DBA name
    businessType: businessTypeEnum("business_type").notNull().default("sole_proprietorship"),
    logoUrl: text("logo_url"),
    signatureUrl: text("signature_url"),                  // For invoices / challans
    websiteUrl: text("website_url"),

    // ── Contact ──────────────────────────────────────────────────────────────
    primaryPhone: text("primary_phone").notNull(),
    altPhone: text("alt_phone"),
    primaryEmail: text("primary_email").notNull(),
    altEmail: text("alt_email"),

    // ── Registered address ───────────────────────────────────────────────────
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    district: text("district"),
    state: text("state").notNull(),                       // Full state name
    stateCode: text("state_code").notNull(),              // 2-digit GST state code e.g. "27"
    pincode: text("pincode").notNull(),                   // 6-digit PIN
    country: text("country").default("India").notNull(),

    // ── Tax registrations (India) ─────────────────────────────────────────────
    gstin: text("gstin").unique(),                        // 15-char GSTIN
    gstRegistrationType: gstRegistrationTypeEnum2("gst_registration_type")
      .default("unregistered"),
    panNo: text("pan_no"),                                // 10-char PAN
    tanNo: text("tan_no"),                                // TAN for TDS deduction
    cin: text("cin"),                                     // CIN for companies / LLPs
    llpin: text("llpin"),                                 // LLPIN for LLPs
    udyamNo: text("udyam_no"),                            // Udyam / MSME registration
    iecCode: text("iec_code"),                            // Import Export Code (DGFT)
    fssaiLicenseNo: text("fssai_license_no"),             // For food businesses
    drugLicenseNo: text("drug_license_no"),               // For pharma businesses
    shopEstablishmentNo: text("shop_establishment_no"),   // Local body registration

    // ── GST / Tax settings ────────────────────────────────────────────────────
    isRcmApplicable: boolean("is_rcm_applicable").default(false).notNull(),
    isTdsApplicable: boolean("is_tds_applicable").default(false).notNull(),
    isTcsApplicable: boolean("is_tcs_applicable").default(false).notNull(),
    isEwayBillRequired: boolean("is_eway_bill_required").default(false).notNull(),
    isEInvoicingEnabled: boolean("is_e_invoicing_enabled").default(false).notNull(),
    eWayBillThreshold: integer("eway_bill_threshold").default(50000),   // ₹50,000 default

    // ── Financial year ────────────────────────────────────────────────────────
    financialYearStart: financialYearStartEnum("financial_year_start")
      .default("april").notNull(),                        // April = India standard

    // ── Invoice / document settings ────────────────────────────────────────────
    invoicePrefix: text("invoice_prefix").default("INV"),
    creditNotePrefix: text("credit_note_prefix").default("CN"),
    debitNotePrefix: text("debit_note_prefix").default("DN"),
    purchaseOrderPrefix: text("purchase_order_prefix").default("PO"),
    challanPrefix: text("challan_prefix").default("DC"),
    invoiceTermsAndConditions: text("invoice_terms_and_conditions"),
    invoiceNotes: text("invoice_notes"),                  // Appears on every invoice footer

    // ── Bank account (primary) ────────────────────────────────────────────────
    bankName: text("bank_name"),
    bankAccountNo: text("bank_account_no"),
    bankIfsc: text("bank_ifsc"),                          // 11-char IFSC
    bankMicr: text("bank_micr"),                          // 9-digit MICR
    bankBranch: text("bank_branch"),
    bankAccountType: bankAccountTypeEnum("bank_account_type").default("current"),
    upiId: text("upi_id"),                                // For QR on invoices

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("business_gstin_idx").on(table.gstin),
    uniqueIndex("business_pan_idx").on(table.panNo),
    uniqueIndex("business_cin_idx").on(table.cin),
    index("business_state_code_idx").on(table.stateCode),
    index("business_type_idx").on(table.businessType),
  ]
);

export type BusinessDetails = typeof businessDetails.$inferSelect;
export type NewBusinessDetails = typeof businessDetails.$inferInsert;
