import { NextFunction, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/authMiddelware";
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

      const rawBody: Record<string, any> = { ...req.body };
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
          // Delete old image from S3 + DB
          if (existing.imageId) {
            const [old] = await tx
              .delete(productImages)
              .where(eq(productImages.id, existing.imageId))
              .returning({ path: productImages.path });
            if (old) await deleteFromS3(old.path);
          }
          const [img] = await tx.insert(productImages).values({ path: key }).returning();
          rawBody.imageId = img.id;
        });
      }

      const parsed = updateProductSchema.parse(rawBody);
      const product = await productService.update(req.params.id, parsed);

      await logAudit({
        userId: req.user!.userId,
        action: "product:update",
        entity: "product",
        entityId: product.id,
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
