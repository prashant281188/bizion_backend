import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { categoryService } from "./category.service";
import { AppError } from "../../middlewares/errorHandler";
import { logAudit, getClientIp } from "../../services/audit.service";
import { ListCategoryInput } from "./category.schema";
import { uploadToS3 } from "../../services/s3.service";

export const categoryController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.list(req.query as unknown as ListCategoryInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getById(req.params.id);
      if (!category) throw new AppError("Category not found", 404);
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError("No image file provided", 400);
      const { key } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, "category");
      const category = await categoryService.create({ ...req.body, categoryImage: key });
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "category",
        entityId: category.id,
        entityLabel: category.categoryName,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json({ success: true, message: "Category created", data: category });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updateData = { ...req.body };
      if (req.file) {
        const { key } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, "category");
        updateData.categoryImage = key;
      }
      const updated = await categoryService.update(req.params.id, updateData);
      if (!updated) throw new AppError("Category not found", 404);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "category",
        entityId: updated.id,
        entityLabel: updated.categoryName,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Category updated", data: updated });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await categoryService.remove(req.params.id);
      if (!deleted) throw new AppError("Category not found", 404);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "category",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Category deleted" });
    } catch (err) {
      next(err);
    }
  },
};
