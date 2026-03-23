import { z } from "zod";

export const listCategorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
});

export const createCategorySchema = z.object({
  categoryName: z.string().trim().min(1, "Category name is required"),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z
  .object({
    categoryName: z.string().trim().min(1).optional(),
    parentId: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.categoryName !== undefined ||
      data.parentId !== undefined ||
      data.description !== undefined ||
      data.isActive !== undefined,
    { message: "At least one field must be provided" }
  );

export type ListCategoryInput = z.infer<typeof listCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
