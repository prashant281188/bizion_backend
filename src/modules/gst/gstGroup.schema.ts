import { z } from "zod";

export const createGstGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  isActive: z.boolean().default(true),
});

export const updateGstGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.name !== undefined || d.isActive !== undefined, {
    message: "At least one field must be provided",
  });

export const listGstGroupSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
});

export type CreateGstGroupInput = z.infer<typeof createGstGroupSchema>;
export type UpdateGstGroupInput = z.infer<typeof updateGstGroupSchema>;
export type ListGstGroupInput = z.infer<typeof listGstGroupSchema>;
