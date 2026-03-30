import { z } from "zod";

const uuid = z.string().uuid();

export const listProductsSchema = z.object({
  // page: z.coerce.number().min(1).default(1),
  // limit: z.coerce.number().min(1).max(999).default(20),
  // search: z.string().optional(),
  categoryId: uuid.optional(),
  brandId: uuid.optional(),
  sort: z.enum(["model_asc", "model_desc", "newest"]).default("model_asc"),
});

export type ListProductsInput = z.infer<typeof listProductsSchema & typeof defaultParams>;

export const defaultParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(99999).default(20),
  search: z.string().optional(),
})

export type Params = z.infer<typeof defaultParams>;