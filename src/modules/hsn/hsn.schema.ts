import { z } from "zod";

export const listHsnSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createHsnSchema = z.object({
  hsnCode: z
    .string()
    .min(4, "HSN code must be at least 4 characters")
    .max(10, "HSN code must be at most 10 characters")
    .regex(/^\d+$/, "HSN code must contain digits only"),
  description: z.string().max(255).optional(),
});

export const updateHsnSchema = z
  .object({
    description: z.string().max(255).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.description !== undefined || data.isActive !== undefined, {
    message: "At least one field must be provided",
  });

export const assignGstGroupSchema = z.object({
  gstGroupId: z.string().uuid("Invalid GST group ID"),
  effectiveFrom: z.string().datetime({ message: "Invalid datetime" }),
  effectiveTo: z.string().datetime({ message: "Invalid datetime" }).optional(),
});

export type ListHsnInput = z.infer<typeof listHsnSchema>;
export type CreateHsnInput = z.infer<typeof createHsnSchema>;
export type UpdateHsnInput = z.infer<typeof updateHsnSchema>;
export type AssignGstGroupInput = z.infer<typeof assignGstGroupSchema>;
