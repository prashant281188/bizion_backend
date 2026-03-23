import { z } from "zod";

/* =====================================================
   COMMON
===================================================== */

const uuid = z.string().uuid("Invalid UUID");

const priceSchema = z
  .number({ invalid_type_error: "Must be a number" })
  .nonnegative("Price cannot be negative");

/* =====================================================
   PRODUCT RATE
===================================================== */

export const productRateSchema = z.object({
  mrp: priceSchema.optional(),
  purchaseRate: priceSchema.optional(),
  saleRate: priceSchema.optional(),
});

/* =====================================================
   PRODUCT VARIANT
===================================================== */

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).optional(),
  finish: z.string().trim().min(1).optional(),
  packing: z
    .number()
    .int("Packing must be an integer")
    .positive("Packing must be positive")
    .optional(),

  rates: productRateSchema.optional(),
});

/* =====================================================
   CREATE PRODUCT
===================================================== */

export const createProductSchema = z.object({
  model: z.string().trim().min(1, "Model is required"),
  brandId: uuid.optional(),
  metal: z.string().trim().optional(),
  description: z.string().trim().optional(),
  categoryId: uuid,
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
});

/* =====================================================
   UPDATE PRODUCT
===================================================== */

export const updateProductSchema =
  createProductSchema.partial();

/* =====================================================
   LIST / FILTER
===================================================== */

export const listProductSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: uuid.optional(),
});

/* =====================================================
   PARAMS
===================================================== */

export const productIdSchema = z.object({
  id: uuid,
});

/* =====================================================
   TYPES
===================================================== */

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;

export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>;

export type ListProductInput = z.infer<
  typeof listProductSchema
>;
