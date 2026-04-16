import { z } from "zod";

// Multer sends all multipart text fields as strings — coerce "true"/"false" to boolean
const coercedBoolean = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true")
  .optional();

export const listCategorySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  search: z.string().optional(),
});

export const createCategorySchema = z.object({
  categoryName: z.string().trim().min(1, "Category name is required"),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  isActive: coercedBoolean,
  categoryImage: z.string().trim().optional(), // populated by controller after S3 upload
  order: z.coerce.number().optional(),
});

export const updateCategorySchema = z
  .object({
    categoryName: z.string().trim().min(1).optional(),
    parentId: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    categoryImage: z.string().trim().optional(),
    order: z.coerce.number().optional(),
    isActive: coercedBoolean,
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
