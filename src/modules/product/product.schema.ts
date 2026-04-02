import { z } from "zod";

/* =====================================================
   COMMON
===================================================== */

const uuid = z.string().uuid("Invalid UUID");

const priceSchema = z
  .number({ invalid_type_error: "Must be a number" })
  .nonnegative("Price cannot be negative");

const statusEnum = z.enum(["draft", "active", "archived"]);

/* =====================================================
   VARIANT RATE
===================================================== */

export const variantRateSchema = z.object({
  mrp: priceSchema.optional(),
  purchaseRate: priceSchema.optional(),
  saleRate: priceSchema.optional(),
});

/* =====================================================
   VARIANT (for create)
===================================================== */

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  packing: z.number().int("Packing must be an integer").positive("Packing must be positive").optional(),
  optionValueIds: z.array(uuid).optional(),
  rates: variantRateSchema.optional(),
});

/* =====================================================
   CREATE PRODUCT
===================================================== */

export const createProductSchema = z.object({
  model: z.string().trim().min(1, "Model is required"),
  metal: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  brandId: uuid.optional(),
  categoryId: uuid,
  hsnId: uuid.optional(),
  unitId: uuid.optional(),
  imageId: uuid.optional(),
  sizeType: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  status: statusEnum.default("draft"),
  variants: z.array(createVariantSchema).optional().default([]),
});

/* =====================================================
   UPDATE VARIANT (for update product)
===================================================== */

export const updateVariantSchema = z.object({
  id: uuid.optional(), // present = update existing; absent = create new
  sku: z.string().trim().min(1).optional(),
  packing: z.number().int("Packing must be an integer").positive("Packing must be positive").optional(),
  optionValueIds: z.array(uuid).optional(),
  rates: variantRateSchema.optional(),
});

/* =====================================================
   UPDATE PRODUCT
===================================================== */

export const updateProductSchema = z
  .object({
    model: z.string().trim().min(1).optional(),
    metal: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    description: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    brandId: uuid.optional(),
    categoryId: uuid.optional(),
    hsnId: uuid.optional(),
    unitId: uuid.optional(),
    imageId: uuid.optional(),
    sizeType: z.string().trim().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    status: statusEnum.optional(),
    // Variant upsert: existing variants by id + new variants without id
    variants: z.array(updateVariantSchema).optional(),
    // IDs of variants to delete
    deleteVariantIds: z.array(uuid).optional(),
    // IDs of variant images to delete
    deleteVariantImageIds: z.array(uuid).optional(),
  })
  .refine(
    (d) => {
      const { variants, deleteVariantIds, deleteVariantImageIds, ...rest } = d;
      return (
        Object.values(rest).some((v) => v !== undefined) ||
        (variants && variants.length > 0) ||
        (deleteVariantIds && deleteVariantIds.length > 0) ||
        (deleteVariantImageIds && deleteVariantImageIds.length > 0)
      );
    },
    { message: "At least one field must be provided" }
  );

/* =====================================================
   LIST / FILTER
===================================================== */

export const listProductSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: uuid.optional(),
  brandId: uuid.optional(),
  status: statusEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
});

/* =====================================================
   TYPES
===================================================== */

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ListProductInput = z.infer<typeof listProductSchema>;
