import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { variantService } from "./variant.service";
import { logAudit } from "../../services/audit.service";
import { AssignOptionValuesInput, CreateRateInput, CreateVariantInput, UpdateVariantInput } from "./variant.schema";

export const variantController = {
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.create(req.params.productId, req.body as CreateVariantInput);
      await logAudit({ userId: req.user!.userId, action: "variant:create", entity: "variant", entityId: data.id, meta: { productId: req.params.productId } });
      res.status(201).json({ success: true, message: "Variant added", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.update(req.params.id, req.body as UpdateVariantInput);
      await logAudit({ userId: req.user!.userId, action: "variant:update", entity: "variant", entityId: data.id });
      res.json({ success: true, message: "Variant updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "variant:delete", entity: "variant", entityId: req.params.id });
      res.json({ success: true, message: "Variant deleted" });
    } catch (err) { next(err); }
  },

  async addRate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.addRate(req.params.id, req.body as CreateRateInput);
      await logAudit({ userId: req.user!.userId, action: "variant:rate:create", entity: "variantRate", entityId: data.id });
      res.status(201).json({ success: true, message: "Rate added", data });
    } catch (err) { next(err); }
  },

  async removeRate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.removeRate(req.params.id, req.params.rateId);
      await logAudit({ userId: req.user!.userId, action: "variant:rate:delete", entity: "variantRate", entityId: req.params.rateId });
      res.json({ success: true, message: "Rate deleted" });
    } catch (err) { next(err); }
  },

  async assignOptionValues(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.assignOptionValues(req.params.id, req.body as AssignOptionValuesInput);
      await logAudit({ userId: req.user!.userId, action: "variant:options:assign", entity: "variant", entityId: req.params.id });
      res.json({ success: true, message: "Option values assigned" });
    } catch (err) { next(err); }
  },

  async removeOptionValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.removeOptionValue(req.params.id, req.params.optionValueId);
      await logAudit({ userId: req.user!.userId, action: "variant:options:remove", entity: "variant", entityId: req.params.id });
      res.json({ success: true, message: "Option value removed" });
    } catch (err) { next(err); }
  },
};
