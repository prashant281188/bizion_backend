import { z } from "zod";

const uuid = z.string().uuid("Invalid UUID");

const priceString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, { message: "Must be a non-negative number" });

/* ===== VARIANT ===== */

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  packing: z.number().int().positive().optional(),
  optionValueIds: z.array(uuid).optional(),
  rates: z
    .object({
      mrp: priceString.optional(),
      purchaseRate: priceString.optional(),
      saleRate: priceString.optional(),
    })
    .optional(),
});

export const updateVariantSchema = z
  .object({
    sku: z.string().trim().min(1).optional(),
    packing: z.number().int().positive().optional(),
  })
  .refine((d) => d.sku !== undefined || d.packing !== undefined, {
    message: "At least one field must be provided",
  });

/* ===== RATE ===== */

export const createRateSchema = z.object({
  mrp: priceString.optional(),
  purchaseRate: priceString.optional(),
  saleRate: priceString.optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

/* ===== OPTION VALUE ASSIGNMENT ===== */

export const assignOptionValuesSchema = z.object({
  optionValueIds: z.array(uuid).min(1, "At least one option value ID is required"),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateRateInput = z.infer<typeof createRateSchema>;
export type AssignOptionValuesInput = z.infer<typeof assignOptionValuesSchema>;
