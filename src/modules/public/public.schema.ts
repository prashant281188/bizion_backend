import { z } from "zod";

const uuid = z.string().uuid();

export const listProductsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: uuid.optional(),
  brandId: uuid.optional(),
  sort: z.enum(["model_asc", "model_desc", "newest"]).default("model_asc"),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
