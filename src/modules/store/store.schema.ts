import { z } from "zod";

const uuid = z.string().uuid();

export const defaultParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(99999).default(20),
  search: z.string().optional(),
});

export const listProductsSchema = defaultParams.merge(z.object({
  categoryId: uuid.optional(),
  brandId: uuid.optional(),
  sort: z.enum(["model_asc", "model_desc", "newest"]).default("model_asc"),
}));

export const catalogQuerySchema = z.object({
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type CatalogQueryInput = z.infer<typeof catalogQuerySchema>;
export type Params = z.infer<typeof defaultParams>;