import { z } from "zod";

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const createPartySchema = z.object({
  name: z.string().trim().min(1, "Party name is required"),
  tradeName: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  altPhone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("")),

  // Address
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  state: z.string().trim().optional(),
  stateCode: z
    .string()
    .trim()
    .regex(/^[0-9]{2}$/, "State code must be 2 digits")
    .optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
    .optional(),
  country: z.string().trim().default("India"),

  // Party type
  type: z.enum(["retailer", "supplier", "customer", "distributor"]),

  // GST
  gstNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstinRegex, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  gstRegistrationType: z
    .enum(["regular", "composition", "unregistered", "consumer", "sez", "overseas"])
    .default("unregistered"),
  panNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(panRegex, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  isRcmApplicable: z.boolean().default(false),
  ecomGstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstinRegex, "Invalid e-commerce GSTIN format")
    .optional()
    .or(z.literal("")),

  // Banking
  bankName: z.string().trim().optional(),
  bankAccountNo: z.string().trim().optional(),
  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ifscRegex, "Invalid IFSC code")
    .optional()
    .or(z.literal("")),
  bankBranch: z.string().trim().optional(),

  notes: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updatePartySchema = createPartySchema.partial();

export const listPartySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
  type: z.enum(["retailer", "supplier", "customer", "distributor"]).optional(),
  gstRegistrationType: z
    .enum(["regular", "composition", "unregistered", "consumer", "sez", "overseas"])
    .optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
export type ListPartyInput = z.infer<typeof listPartySchema>;
