import { NextFunction, Response } from "express";
import { inArray } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { AppError } from "../../middlewares/errorHandler";
import { productService } from "./product.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import {
  ListProductInput,
  VariantImageMapping,
  createProductSchema,
  updateProductSchema,
  variantImageMappingSchema,
} from "./product.schema";
import { uploadToS3, deleteFromS3 } from "../../services/s3.service";
import { db } from "../../config/db";
import { variantImages } from "../../db/schema";

/* =====================================================
   HELPERS
===================================================== */

/**
 * Multipart/form-data sends booleans as strings ("true"/"false").
 * This mutates the body in-place before schema parsing.
 */
function parseFormBooleans(body: Record<string, unknown>): void {
  for (const key of ["isActive", "isFeatured", "isNew"]) {
    if (body[key] === "true")  body[key] = true;
    if (body[key] === "false") body[key] = false;
  }
}

/**
 * Safely JSON-parses a string field in the request body.
 * Throws a 400 AppError with a descriptive message on failure.
 */
function parseJsonField(body: Record<string, unknown>, key: string): void {
  if (typeof body[key] === "string") {
    try {
      body[key] = JSON.parse(body[key] as string);
    } catch {
      throw new AppError(`"${key}" must be a valid JSON string when sent as form-data`, 400);
    }
  }
}

/* =====================================================
   CONTROLLER
===================================================== */

export const productController = {

  /* ─────────────────────────────────────────────────
     LIST
     GET /products?page=1&limit=10&search=...&sortBy=model
  ───────────────────────────────────────────────── */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.query as unknown as ListProductInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  /* ─────────────────────────────────────────────────
     GET BY ID
     GET /products/:id
  ───────────────────────────────────────────────── */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);
      if (!product) throw new AppError("Product not found", 404);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  /* ─────────────────────────────────────────────────
     CREATE
     POST /products  (multipart/form-data)

     Form fields:
       model, categoryId, brandId, hsnId, unitId,
       metal, shortDescription, description, slug,
       sizeType, isActive, isFeatured, isNew, status
       variants  — JSON string (see schema above)

     Files:
       productImage   — single file, becomes the cover image
       variantImages  — up to 20 files; must pair with
                        variantImageMappings JSON field
                        (only applies if variants are created)

     Note: After creating the product, variant image mappings
     are applied by variantId — NOT by positional index.
     Frontend must send explicit mappings.
  ───────────────────────────────────────────────── */

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const productImageFile  = files?.productImage?.[0];
      const variantImageFiles = files?.variantImages ?? [];

      // Prepare body: parse JSON fields + coerce booleans from form-data
      const rawBody: Record<string, unknown> = { ...req.body };
      parseJsonField(rawBody, "variants");
      parseJsonField(rawBody, "variantImageMappings");
      parseFormBooleans(rawBody);

      const parsed = createProductSchema.parse(rawBody);

      // Upload cover image to S3 if provided; pass key to service (not imageId)
      // so the service can set productId correctly inside one transaction.
      let productImageKey: string | undefined;
      if (productImageFile) {
        const { key } = await uploadToS3(
          productImageFile.buffer,
          productImageFile.originalname,
          productImageFile.mimetype,
          `products/${parsed.model}`
        );
        productImageKey = key;
      }

      // Service creates product + cover image + variants atomically
      const product = await productService.create(parsed, productImageKey);

      // Associate uploaded variant image files with specific variants
      // via explicit mapping: [{ variantId, fileIndex }, ...]
      await attachVariantImages(variantImageFiles, rawBody.variantImageMappings, parsed.model);

      await logAudit({
        userId:    req.user!.userId,
        action:    "create",
        entity:    "product",
        entityId:  product.id,
        entityLabel: product.model,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json({ success: true, message: "Product created", data: product });
    } catch (err) {
      next(err);
    }
  },

  /* ─────────────────────────────────────────────────
     UPDATE
     PATCH /products/:id  (multipart/form-data)

     Form fields:
       Any subset of product scalar fields.
       variants                — JSON string (upsert list)
       deleteVariantIds        — JSON string (UUID array)
       deleteVariantImageIds   — JSON string (UUID array)
       variantImageMappings    — JSON string (mapping array for new uploads)

     Files:
       productImage   — replaces the current cover image
       variantImages  — new images for existing variants;
                        must pair with variantImageMappings

     Image replacement flow:
       1. Controller fetches old cover S3 key
       2. Controller uploads new file to S3
       3. Service swaps DB records in a transaction
       4. Controller deletes old S3 object

     Variant image deletion flow:
       1. Controller fetches S3 keys for deleteVariantImageIds
       2. Controller deletes from S3
       3. Service deletes DB rows in the same transaction as the rest of the update
  ───────────────────────────────────────────────── */

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const productImageFile  = files?.productImage?.[0];
      const variantImageFiles = files?.variantImages ?? [];

      const rawBody: Record<string, unknown> = { ...req.body };
      for (const key of ["variants", "deleteVariantIds", "deleteVariantImageIds", "variantImageMappings"]) {
        parseJsonField(rawBody, key);
      }
      parseFormBooleans(rawBody);

      const parsed = updateProductSchema.parse(rawBody);

      // ── Step 1: Resolve old cover image path (for S3 deletion after update) ──
      let oldCoverPath: string | null = null;
      let newProductImageKey: string | undefined;

      if (productImageFile) {
        oldCoverPath = await productService.getOldCoverImagePath(req.params.id);

        const { key } = await uploadToS3(
          productImageFile.buffer,
          productImageFile.originalname,
          productImageFile.mimetype,
          `products`
        );
        newProductImageKey = key;
      }

      // ── Step 2: Fetch S3 paths for variant images to delete (before DB rows are gone) ──
      const deleteVariantImageIds = parsed.deleteVariantImageIds ?? [];
      let variantImagePathsToDelete: string[] = [];

      if (deleteVariantImageIds.length > 0) {
        const rows = await db
          .select({ path: variantImages.path })
          .from(variantImages)
          .where(inArray(variantImages.id, deleteVariantImageIds));
        variantImagePathsToDelete = rows.map((r) => r.path);
      }

      // ── Step 3: Service handles all DB mutations in one transaction ──
      const result = await productService.update(req.params.id, parsed, newProductImageKey);

      // ── Step 4: S3 cleanup (after DB commit — best-effort; log on failure) ──
      if (oldCoverPath) {
        await deleteFromS3(oldCoverPath).catch((err) =>
          console.error(`[S3] Failed to delete old cover image ${oldCoverPath}:`, err)
        );
      }
      if (variantImagePathsToDelete.length > 0) {
        await Promise.allSettled(variantImagePathsToDelete.map((p) => deleteFromS3(p)));
      }

      // ── Step 5: Upload new variant images and link to existing variants ──
      if (variantImageFiles.length > 0) {
        const productModel = (parsed as any).model ?? "product";
        await attachVariantImages(variantImageFiles, rawBody.variantImageMappings, productModel);
      }

      await logAudit({
        userId:    req.user!.userId,
        action:    "update",
        entity:    "product",
        entityId:  req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Product updated", data: result });
    } catch (err) {
      next(err);
    }
  },

  /* ─────────────────────────────────────────────────
     DELETE
     DELETE /products/:id
     Soft-delete only — data is preserved for audit.
  ───────────────────────────────────────────────── */

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await productService.remove(req.params.id);

      await logAudit({
        userId:    req.user!.userId,
        action:    "delete",
        entity:    "product",
        entityId:  req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Product deleted" });
    } catch (err) {
      next(err);
    }
  },
};

/* =====================================================
   PRIVATE HELPER — variant image attachment
   Uploads files to S3 and inserts variantImages rows
   using explicit { variantId, fileIndex } mappings.
   Called by both create and update handlers.
===================================================== */

async function attachVariantImages(
  files: Express.Multer.File[],
  rawMappings: unknown,
  folderHint: string
): Promise<void> {
  if (files.length === 0 || !rawMappings) return;

  // Parse and validate the mappings array
  let mappings: VariantImageMapping[] = [];
  const rawArr = Array.isArray(rawMappings) ? rawMappings : [];
  for (const item of rawArr) {
    const result = variantImageMappingSchema.safeParse(item);
    if (result.success) mappings.push(result.data);
  }

  if (mappings.length === 0) return;

  // Upload each referenced file and insert the DB row
  await Promise.all(
    mappings.map(async ({ variantId, fileIndex }) => {
      const file = files[fileIndex];
      if (!file) return;

      const { key } = await uploadToS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        `products/${folderHint}/variants`
      );

      await db.insert(variantImages).values({
        productVariantId: variantId,
        path: key,
      });
    })
  );
}
