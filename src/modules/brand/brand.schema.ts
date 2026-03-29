import { z } from "zod";

export const createBrandSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required"),
});

export const updateBrandSchema = z.object({
  brandName: z.string().trim().min(1).optional(),
  brandLogo: z.string().trim().optional(),
});

export const listBrandSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type ListBrandInput = z.infer<typeof listBrandSchema>;
