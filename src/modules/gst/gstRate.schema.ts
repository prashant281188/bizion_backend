import { z } from "zod";

const uuid = z.string().uuid("Invalid UUID");

const rateField = z
  .number({ invalid_type_error: "Must be a number" })
  .min(0)
  .max(100, "Rate cannot exceed 100%");

export const createGstRateSchema = z.object({
  gstGroupId: uuid,
  cgst: rateField,
  sgst: rateField,
  igst: rateField,
  effectiveFrom: z.string().datetime({ message: "Invalid datetime" }),
  effectiveTo: z.string().datetime({ message: "Invalid datetime" }).optional(),
});

export const updateGstRateSchema = z
  .object({
    cgst: rateField.optional(),
    sgst: rateField.optional(),
    igst: rateField.optional(),
    effectiveFrom: z.string().datetime().optional(),
    effectiveTo: z.string().datetime().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const listGstRateSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  gstGroupId: uuid.optional(),
});

export type CreateGstRateInput = z.infer<typeof createGstRateSchema>;
export type UpdateGstRateInput = z.infer<typeof updateGstRateSchema>;
export type ListGstRateInput = z.infer<typeof listGstRateSchema>;
