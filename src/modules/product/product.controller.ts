import { NextFunction, Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { productService } from "./product.service";

export const productController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await productService.list(req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET ================= */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);

      if (!product) throw new AppError("Product not found", 404);

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
};
