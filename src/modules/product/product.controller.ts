import { NextFunction, Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { AppError } from "../../middlewares/errorHandler";
import { productService } from "./product.service";
import { logAudit } from "../../services/audit.service";
import { ListProductInput, createProductSchema, updateProductSchema } from "./product.schema";
import { uploadToS3, deleteFromS3 } from "../../services/s3.service";
import { db } from "../../config/db";
import { productImages, variantImages, productVariants, products } from "../../db/schema";

/* =====================================================
   HELPER — coerce string "true"/"false" → boolean
   (multer returns all text fields as strings)
===================================================== */

function parseFormBooleans(body: Record<string, any>): void {
  for (const key of ["isActive", "isFeatured", "isNew"]) {
    if (body[key] === "true") body[key] = true;
    else if (body[key] === "false") body[key] = false;
  }
}

export const productController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.query as unknown as ListProductInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET BY ID ================= */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);

      if (!product) throw new AppError("Product not found", 404);

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const productImageFile = files?.productImage?.[0];
      const variantImageFiles = files?.variantImages ?? [];

      // Multer gives all text fields as strings — parse nested JSON for variants
      const rawBody: Record<string, any> = { ...req.body };
      if (typeof rawBody.variants === "string") {
        try {
          rawBody.variants = JSON.parse(rawBody.variants);
        } catch {
          throw new AppError("variants must be a valid JSON string when sent as form-data", 400);
        }
      }
      parseFormBooleans(rawBody);

      const parsed = createProductSchema.parse(rawBody);

      // Upload product image and create DB record before the product transaction
      if (productImageFile) {
        const { key } = await uploadToS3(
          productImageFile.buffer,
          productImageFile.originalname,
          productImageFile.mimetype
        );
        const [img] = await db.insert(productImages).values({ path: key }).returning();
        parsed.imageId = img.id;
      }

      const product = await productService.create(parsed);

      // Upload variant images and link by creation order (index matches variants array)
      if (variantImageFiles.length > 0) {
        const createdVariants = await db.query.productVariants.findMany({
          where: eq(productVariants.productId, product.id),
          columns: { id: true },
          orderBy: [asc(productVariants.createdAt)],
        });

        for (let i = 0; i < variantImageFiles.length; i++) {
          if (i >= createdVariants.length) break;
          const file = variantImageFiles[i];
          const { key } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
          await db.insert(variantImages).values({ productVariantId: createdVariants[i].id, path: key });
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: "product:create",
        entity: "product",
        entityId: product.id,
      });

      res.status(201).json({ success: true, message: "Product created", data: product });
    } catch (err) {
      next(err);
    }
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const productImageFile = files?.productImage?.[0];
      const variantImageFiles = files?.variantImages ?? [];

      const rawBody: Record<string, any> = { ...req.body };

      // Parse JSON fields sent as strings in multipart/form-data
      for (const key of ["variants", "deleteVariantIds", "deleteVariantImageIds"]) {
        if (typeof rawBody[key] === "string") {
          try {
            rawBody[key] = JSON.parse(rawBody[key]);
          } catch {
            throw new AppError(`${key} must be a valid JSON string when sent as form-data`, 400);
          }
        }
      }
      parseFormBooleans(rawBody);

      // Replace product image if a new file was provided
      if (productImageFile) {
        const existing = await db.query.products.findFirst({
          where: and(eq(products.id, req.params.id), eq(products.isDeleted, false)),
          columns: { id: true, imageId: true },
        });
        if (!existing) throw new AppError("Product not found", 404);

        const { key } = await uploadToS3(
          productImageFile.buffer,
          productImageFile.originalname,
          productImageFile.mimetype
        );

        await db.transaction(async (tx) => {
          // Insert new image first
          const [img] = await tx.insert(productImages).values({ path: key }).returning();
          rawBody.imageId = img.id;

          // Point product to new image so the FK on the old image is released
          await tx
            .update(products)
            .set({ imageId: img.id, updatedAt: new Date() })
            .where(eq(products.id, req.params.id));

          // Now safe to delete the old image
          if (existing.imageId) {
            const [old] = await tx
              .delete(productImages)
              .where(eq(productImages.id, existing.imageId))
              .returning({ path: productImages.path });
            if (old) await deleteFromS3(old.path);
          }
        });
      }

      // Delete variant images from S3 + DB
      const deleteVariantImageIds: string[] = Array.isArray(rawBody.deleteVariantImageIds)
        ? rawBody.deleteVariantImageIds
        : [];
      if (deleteVariantImageIds.length > 0) {
        const toDelete = await db
          .select({ id: variantImages.id, path: variantImages.path })
          .from(variantImages)
          .where(inArray(variantImages.id, deleteVariantImageIds));

        await db.delete(variantImages).where(inArray(variantImages.id, deleteVariantImageIds));
        await Promise.all(toDelete.map((img) => deleteFromS3(img.path)));
      }

      const parsed = updateProductSchema.parse(rawBody);
      const product = await productService.update(req.params.id, parsed);

      // Upload variant images and link by index matching the variants array order
      // New variants (no id) are created first, so we fetch them by createdAt order
      if (variantImageFiles.length > 0 && parsed.variants && parsed.variants.length > 0) {
        const newVariantCount = parsed.variants.filter((v) => !v.id).length;

        if (newVariantCount > 0) {
          // Fetch newly-created variants (the last N by createdAt)
          const allVariants = await db.query.productVariants.findMany({
            where: eq(productVariants.productId, req.params.id),
            columns: { id: true },
            orderBy: [asc(productVariants.createdAt)],
          });
          const newVariants = allVariants.slice(-newVariantCount);

          for (let i = 0; i < variantImageFiles.length; i++) {
            if (i >= newVariants.length) break;
            const file = variantImageFiles[i];
            const { key } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            await db.insert(variantImages).values({ productVariantId: newVariants[i].id, path: key });
          }
        }

        // Also handle variantImages for existing variants: client sends variantId in file fieldname
        // e.g. variantImages[variantId] — handled via explicit variantId mapping below
      }

      // Support uploading images to existing variants via variantImageMappings field:
      // variantImageMappings = JSON array of { variantId, fileIndex } to link uploaded files to existing variants
      if (variantImageFiles.length > 0 && rawBody.variantImageMappings) {
        let mappings: { variantId: string; fileIndex: number }[] = [];
        try {
          mappings = typeof rawBody.variantImageMappings === "string"
            ? JSON.parse(rawBody.variantImageMappings)
            : rawBody.variantImageMappings;
        } catch {
          throw new AppError("variantImageMappings must be a valid JSON string", 400);
        }

        for (const { variantId, fileIndex } of mappings) {
          const file = variantImageFiles[fileIndex];
          if (!file) continue;
          const { key } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
          await db.insert(variantImages).values({ productVariantId: variantId, path: key });
        }
      }

      await logAudit({
        userId: req.user!.userId,
        action: "product:update",
        entity: "product",
        entityId: req.params.id,
      });

      res.json({ success: true, message: "Product updated", data: product });
    } catch (err) {
      next(err);
    }
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await productService.remove(req.params.id);

      await logAudit({
        userId: req.user!.userId,
        action: "product:delete",
        entity: "product",
        entityId: req.params.id,
      });

      res.json({ success: true, message: "Product deleted" });
    } catch (err) {
      next(err);
    }
  },
};
