import { z } from "zod";

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pinRegex   = /^[1-9][0-9]{5}$/;
const tanRegex   = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

// ─── Create ───────────────────────────────────────────────────────────────────

export const createBusinessSchema = z.object({
  legalName:    z.string().trim().min(1, "Legal name is required"),
  tradeName:    z.string().trim().optional(),
  businessType: z.enum([
    "sole_proprietorship", "partnership", "llp", "private_limited",
    "public_limited", "one_person_company", "huf", "trust", "society",
    "ngo", "government", "other",
  ]).default("sole_proprietorship"),

  // Contact
  primaryPhone: z.string().trim().min(10, "Phone must be at least 10 digits"),
  altPhone:     z.string().trim().optional(),
  primaryEmail: z.string().trim().email("Invalid email"),
  altEmail:     z.string().trim().email("Invalid email").optional(),
  websiteUrl:   z.string().trim().url("Invalid URL").optional(),

  // Address
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city:         z.string().trim().min(1, "City is required"),
  district:     z.string().trim().optional(),
  state:        z.string().trim().min(1, "State is required"),
  stateCode:    z.string().trim().regex(/^[0-9]{2}$/, "State code must be 2 digits"),
  pincode:      z.string().trim().regex(pinRegex, "Invalid 6-digit pincode"),
  country:      z.string().trim().default("India"),

  // Tax registrations
  gstin:               z.string().trim().regex(gstinRegex, "Invalid GSTIN").optional(),
  gstRegistrationType: z.enum([
    "regular", "composition", "unregistered", "sez_unit", "sez_developer",
  ]).default("unregistered"),
  panNo:               z.string().trim().regex(panRegex, "Invalid PAN").optional(),
  tanNo:               z.string().trim().regex(tanRegex, "Invalid TAN").optional(),
  cin:                 z.string().trim().optional(),
  llpin:               z.string().trim().optional(),
  udyamNo:             z.string().trim().optional(),
  iecCode:             z.string().trim().optional(),
  fssaiLicenseNo:      z.string().trim().optional(),
  drugLicenseNo:       z.string().trim().optional(),
  shopEstablishmentNo: z.string().trim().optional(),

  // GST / Tax toggles
  isRcmApplicable:     z.boolean().default(false),
  isTdsApplicable:     z.boolean().default(false),
  isTcsApplicable:     z.boolean().default(false),
  isEwayBillRequired:  z.boolean().default(false),
  isEInvoicingEnabled: z.boolean().default(false),
  eWayBillThreshold:   z.number().int().min(0).default(50000),

  // Financial year
  financialYearStart: z.enum(["april", "january"]).default("april"),

  // Document settings
  invoicePrefix:              z.string().trim().default("INV"),
  creditNotePrefix:           z.string().trim().default("CN"),
  debitNotePrefix:            z.string().trim().default("DN"),
  purchaseOrderPrefix:        z.string().trim().default("PO"),
  challanPrefix:              z.string().trim().default("DC"),
  invoiceTermsAndConditions:  z.string().trim().optional(),
  invoiceNotes:               z.string().trim().optional(),

  // Banking
  bankName:        z.string().trim().optional(),
  bankAccountNo:   z.string().trim().optional(),
  bankIfsc:        z.string().trim().regex(ifscRegex, "Invalid IFSC code").optional(),
  bankMicr:        z.string().trim().optional(),
  bankBranch:      z.string().trim().optional(),
  bankAccountType: z.enum(["current", "savings", "cc", "od"]).default("current"),
  upiId:           z.string().trim().optional(),
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── List / Query ─────────────────────────────────────────────────────────────

export const listBusinessSchema = z.object({
  page:   z.coerce.number().min(1).default(1).optional(),
  limit:  z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().trim().optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type ListBusinessInput   = z.infer<typeof listBusinessSchema>;
