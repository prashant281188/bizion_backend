import { z } from "zod";

/* =====================================================
   PRIMITIVES — reusable micro-validators
===================================================== */

const uuid = z.string().uuid("Invalid UUID");

/** Non-negative decimal accepted from frontend (stored as numeric string in DB) */
const priceSchema = z
  .number({ invalid_type_error: "Price must be a number" })
  .nonnegative("Price cannot be negative");

const productStatusEnum = z.enum(["draft", "active", "archived"]);

/* =====================================================
   VARIANT RATE
   At least one price field is required when the rates
   object is present — prevents empty rate objects.
===================================================== */

export const variantRateSchema = z
  .object({
    mrp:          priceSchema.optional(),
    purchaseRate: priceSchema.optional(),
    saleRate:     priceSchema.optional(),
  })
  .refine(
    (r) => Object.values(r).some((v) => v !== undefined),
    { message: "At least one of mrp, purchaseRate, saleRate is required" }
  );

/* =====================================================
   VARIANT IMAGE MAPPING
   Sent as a JSON array in multipart requests to
   explicitly associate uploaded files with variants.

   Frontend: variantImageMappings = JSON.stringify([
     { variantId: "uuid", fileIndex: 0 },
     { variantId: "uuid", fileIndex: 1 },
   ])
===================================================== */

export const variantImageMappingSchema = z.object({
  /** UUID of an EXISTING variant that this file belongs to */
  variantId: uuid,
  /** Zero-based index into the variantImages file array */
  fileIndex: z.number().int().min(0),
});

/* =====================================================
   VARIANT — create
   Used inside the createProductSchema.variants array.
===================================================== */

export const createVariantSchema = z.object({
  sku:     z.string().trim().min(1, "SKU cannot be blank").optional(),
  barcode: z.string().trim().optional(),

  /**
   * Packing quantity (e.g. 500 for 500 ml).
   * Stored as numeric(10,2) — send as a JS number, max 2 decimal places.
   */
  packing: z.number().positive("Packing must be positive").optional(),

  isActive: z.boolean().default(true),

  /**
   * IDs of option values that define this variant.
   * Example: [sizeL_id, colourRed_id]
   * Fetch available options from GET /api/options.
   */
  optionValueIds: z.array(uuid).optional(),

  /**
   * Initial pricing for this variant.
   * Creates the first rate row (effectiveFrom = now, effectiveTo = null).
   */
  rates: variantRateSchema.optional(),
});

/* =====================================================
   PRODUCT — create
===================================================== */

export const createProductSchema = z.object({
  /** Display name / model number (e.g. "Nike Air Max 270") */
  model: z.string().trim().min(1, "Model is required").max(255),

  /** Material type (e.g. "Gold", "Silver", "Platinum") */
  metal: z.string().trim().optional(),

  /** Short marketing blurb — shown in cards / search results */
  shortDescription: z.string().trim().max(500).optional(),

  /** Full rich-text description — shown on the product detail page */
  description: z.string().trim().optional(),

  /**
   * URL slug — auto-generated from model if omitted.
   * Must be lowercase alphanumeric with hyphens only.
   */
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),

  brandId:    uuid.optional(),
  categoryId: uuid,                 // required
  hsnId:      uuid.optional(),
  unitId:     uuid.optional(),

  /**
   * imageId is NOT sent by the frontend — it is populated by the backend
   * after uploading the productImage file to S3.
   * Kept in schema to allow internal service usage.
   */
  imageId: uuid.optional(),

  sizeType: z.string().trim().optional(),

  isActive:   z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew:      z.boolean().default(false),
  status:     productStatusEnum.default("draft"),

  variants: z.array(createVariantSchema).default([]),
});

/* =====================================================
   VARIANT — update (within PATCH /products/:id)
   id present  → update existing variant
   id absent   → create a new variant
===================================================== */

export const updateVariantSchema = z.object({
  /** UUID of an existing variant. Omit to create a brand-new variant. */
  id: uuid.optional(),

  sku:      z.string().trim().min(1).optional(),
  barcode:  z.string().trim().optional(),
  packing:  z.number().positive().optional(),
  isActive: z.boolean().optional(),

  /**
   * Full replacement of option values.
   * Send the complete desired set — existing links not in this array are removed.
   * Omit the field entirely to leave option values unchanged.
   */
  optionValueIds: z.array(uuid).optional(),

  /**
   * Updating rates creates a new history row (effectiveTo closed on old row).
   * Omit to leave prices unchanged.
   */
  rates: variantRateSchema.optional(),
});

/* =====================================================
   PRODUCT — update (PATCH)
   All fields optional; at least one must be provided.
===================================================== */

export const updateProductSchema = z
  .object({
    model:            z.string().trim().min(1).max(255).optional(),
    metal:            z.string().trim().optional(),
    shortDescription: z.string().trim().max(500).optional(),
    description:      z.string().trim().optional(),
    slug:             z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
    brandId:          uuid.optional(),
    categoryId:       uuid.optional(),
    hsnId:            uuid.optional(),
    unitId:           uuid.optional(),
    imageId:          uuid.optional(),      // set by controller after S3 upload
    sizeType:         z.string().trim().optional(),
    isActive:         z.boolean().optional(),
    isFeatured:       z.boolean().optional(),
    isNew:            z.boolean().optional(),
    status:           productStatusEnum.optional(),

    /** Variant upsert list — mix of existing (id present) and new (id absent) */
    variants: z.array(updateVariantSchema).optional(),

    /** UUIDs of variants to hard-delete */
    deleteVariantIds: z.array(uuid).optional(),

    /** UUIDs of variant images to delete from S3 and DB */
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
    { message: "At least one field must be provided for update" }
  );

/* =====================================================
   LIST / FILTER
===================================================== */

export const listProductSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  /** Partial match on product model */
  search:     z.string().trim().optional(),
  categoryId: uuid.optional(),
  brandId:    uuid.optional(),
  status:     productStatusEnum.optional(),
  isActive:   z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNew:      z.coerce.boolean().optional(),

  sortBy:    z.enum(["model", "createdAt", "updatedAt"]).default("model"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/* =====================================================
   EXPORTED TYPES
===================================================== */

export type CreateProductInput   = z.infer<typeof createProductSchema>;
export type UpdateProductInput   = z.infer<typeof updateProductSchema>;
export type UpdateVariantInput   = z.infer<typeof updateVariantSchema>;
export type ListProductInput     = z.infer<typeof listProductSchema>;
export type VariantImageMapping  = z.infer<typeof variantImageMappingSchema>;
