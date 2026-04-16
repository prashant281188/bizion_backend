import { z } from "zod";

export const createBrandSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required"),
  brandLogo: z.string().trim().optional(),
  description: z.string().optional(),
});

export const updateBrandSchema = z.object({
  brandName: z.string().trim().min(1),
  brandLogo: z.string().trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean()
});

export const listBrandSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type ListBrandInput = z.infer<typeof listBrandSchema>;
