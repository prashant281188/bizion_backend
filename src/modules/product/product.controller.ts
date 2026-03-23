import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { AppError } from "../../middlewares/errorHandler";
import { productService } from "./product.service";
import { logAudit } from "../../services/audit.service";
import { ListProductInput } from "./product.schema";

export const productController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await productService.list(req.query as unknown as ListProductInput);
      res.json({ success: true, data });
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
      const product = await productService.create(req.body);

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
      const product = await productService.update(req.params.id, req.body);

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
