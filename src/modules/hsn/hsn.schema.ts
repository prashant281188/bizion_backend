import { z } from "zod";

export const listHsnSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const createHsnSchema = z.object({
  hsnCode: z.string().min(4, "HSN code must be at least 4 characters").max(10),
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

export type ListHsnInput = z.infer<typeof listHsnSchema>;
export type CreateHsnInput = z.infer<typeof createHsnSchema>;
export type UpdateHsnInput = z.infer<typeof updateHsnSchema>;
