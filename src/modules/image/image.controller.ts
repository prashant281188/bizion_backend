import { NextFunction, Response } from "express";
import path from "path";
import fs from "fs";
import { and, eq } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { AppError } from "../../middlewares/errorHandler";
import { db } from "../../config/db";
import { products, productImages, variantImages, productVariants } from "../../db/schema";
import { logAudit } from "../../services/audit.service";

function deleteFileFromDisk(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), "uploads", filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // Non-fatal — log but don't throw
    console.error("Failed to delete file from disk:", filePath);
  }
}

export const imageController = {
  /* ===== PRODUCT IMAGE ===== */

  async uploadProductImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) throw new AppError("No image file provided", 400);

      const product = await db.query.products.findFirst({
        where: and(eq(products.id, req.params.id), eq(products.isDeleted, false)),
        columns: { id: true, imageId: true },
      });
      if (!product) throw new AppError("Product not found", 404);

      const relativePath = `products/${file.filename}`;

      await db.transaction(async (tx) => {
        // Delete old image if present
        if (product.imageId) {
          const [old] = await tx
            .delete(productImages)
            .where(eq(productImages.id, product.imageId))
            .returning({ path: productImages.path });
          if (old) deleteFileFromDisk(old.path);
        }

        const [image] = await tx
          .insert(productImages)
          .values({ path: relativePath })
          .returning();

        await tx
          .update(products)
          .set({ imageId: image.id, updatedAt: new Date() })
          .where(eq(products.id, product.id));
      });

      await logAudit({ userId: req.user!.userId, action: "product:image:upload", entity: "product", entityId: product.id });

      res.status(201).json({ success: true, message: "Image uploaded", data: { path: relativePath } });
    } catch (err) { next(err); }
  },

  async deleteProductImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await db.query.products.findFirst({
        where: and(eq(products.id, req.params.id), eq(products.isDeleted, false)),
        columns: { id: true, imageId: true },
      });
      if (!product) throw new AppError("Product not found", 404);
      if (!product.imageId) throw new AppError("Product has no image", 404);

      await db.transaction(async (tx) => {
        const [old] = await tx
          .delete(productImages)
          .where(eq(productImages.id, product.imageId!))
          .returning({ path: productImages.path });

        await tx
          .update(products)
          .set({ imageId: null, updatedAt: new Date() })
          .where(eq(products.id, product.id));

        if (old) deleteFileFromDisk(old.path);
      });

      await logAudit({ userId: req.user!.userId, action: "product:image:delete", entity: "product", entityId: product.id });

      res.json({ success: true, message: "Image deleted" });
    } catch (err) { next(err); }
  },

  /* ===== VARIANT IMAGE ===== */

  async uploadVariantImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) throw new AppError("No image file provided", 400);

      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, req.params.id),
        columns: { id: true },
      });
      if (!variant) throw new AppError("Variant not found", 404);

      const relativePath = `products/${file.filename}`;

      const [image] = await db
        .insert(variantImages)
        .values({ productVariantId: variant.id, path: relativePath })
        .returning();

      await logAudit({ userId: req.user!.userId, action: "variant:image:upload", entity: "variant", entityId: variant.id });

      res.status(201).json({ success: true, message: "Image uploaded", data: image });
    } catch (err) { next(err); }
  },

  async deleteVariantImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [deleted] = await db
        .delete(variantImages)
        .where(
          and(
            eq(variantImages.id, req.params.imageId),
            eq(variantImages.productVariantId, req.params.id)
          )
        )
        .returning({ path: variantImages.path });

      if (!deleted) throw new AppError("Image not found", 404);

      deleteFileFromDisk(deleted.path);

      await logAudit({ userId: req.user!.userId, action: "variant:image:delete", entity: "variant", entityId: req.params.id });

      res.json({ success: true, message: "Image deleted" });
    } catch (err) { next(err); }
  },
};
