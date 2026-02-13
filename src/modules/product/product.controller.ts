import { Response } from "express";
import { AppError } from "../../middlewares/errorHandler";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { productService } from "./product.service";


export const productController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response) {
    const data = await productService.list(req.query);

    res.json({ success: true, data });
  },

  /* ================= GET ================= */

  async getById(req: AuthRequest, res: Response) {
    const product = await productService.getById(req.params.id);

    if (!product)
      throw new AppError("Product not found", 404);

    res.json({ success: true, data: product });
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response) {
    const product = await productService.create(req.body);

    await logAudit({
      userId: req.user!.userId,
      action: "product:create",
      entity: "product",
      entityId: product.id,
    });

    res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response) {
    const updated = await productService.update(
      req.params.id,
      req.body
    );

    if (!updated)
      throw new AppError("Product not found", 404);

    await logAudit({
      userId: req.user!.userId,
      action: "product:update",
      entity: "product",
      entityId: updated.id,
    });

    res.json({
      success: true,
      message: "Product updated",
      data: updated,
    });
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response) {
    const deleted = await productService.remove(
      req.params.id
    );

    if (!deleted)
      throw new AppError("Product not found", 404);

    await logAudit({
      userId: req.user!.userId,
      action: "product:delete",
      entity: "product",
      entityId: req.params.id,
    });

    res.json({
      success: true,
      message: "Product deleted",
    });
  },
};
