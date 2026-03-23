import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { categoryService } from "./category.service";
import { AppError } from "../../middlewares/errorHandler";
import { logAudit } from "../../services/audit.service";
import { ListCategoryInput } from "./category.schema";

export const categoryController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.list(req.query as unknown as ListCategoryInput);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET ================= */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getById(req.params.id);

      if (!category) throw new AppError("Category not found", 404);

      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.create(req.body);

      await logAudit({
        userId: req.user!.userId,
        action: "category:create",
        entity: "category",
        entityId: category.id,
      });

      res.status(201).json({
        success: true,
        message: "Category created",
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await categoryService.update(req.params.id, req.body);

      if (!updated) throw new AppError("Category not found", 404);

      await logAudit({
        userId: req.user!.userId,
        action: "category:update",
        entity: "category",
        entityId: updated.id,
      });

      res.json({ success: true, message: "Category updated", data: updated });
    } catch (err) {
      next(err);
    }
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await categoryService.remove(req.params.id);

      if (!deleted) throw new AppError("Category not found", 404);

      await logAudit({
        userId: req.user!.userId,
        action: "category:delete",
        entity: "category",
        entityId: req.params.id,
      });

      res.json({ success: true, message: "Category deleted" });
    } catch (err) {
      next(err);
    }
  },
};
