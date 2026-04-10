import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { variantService } from "./variant.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { AssignOptionValuesInput, CreateRateInput, CreateVariantInput, UpdateVariantInput } from "./variant.schema";

type Search = { search: string };

export const variantController = {
  async getSkus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await variantService.getSkus(req.query as Search);
      res.status(201).json({ success: true, message: "skus retrieved", data });
    } catch (err) { next(err); }
  },

  async getVariantRateAndPacking(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await variantService.getVariantRateAndPacking(req.params.id);
      res.status(201).json({ success: true, message: "skus retrieved", data });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.create(req.params.productId, req.body as CreateVariantInput);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "variant",
        entityId: data.id,
        entityLabel: data.sku,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { productId: req.params.productId },
        after: data,
      });
      res.status(201).json({ success: true, message: "Variant added", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.update(req.params.id, req.body as UpdateVariantInput);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "variant",
        entityId: data.id,
        entityLabel: data.sku,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Variant updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "variant",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Variant deleted" });
    } catch (err) { next(err); }
  },

  async addRate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await variantService.addRate(req.params.id, req.body as CreateRateInput);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "variantRate",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { variantId: req.params.id },
        after: data,
      });
      res.status(201).json({ success: true, message: "Rate added", data });
    } catch (err) { next(err); }
  },

  async removeRate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.removeRate(req.params.id, req.params.rateId);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "variantRate",
        entityId: req.params.rateId,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { variantId: req.params.id },
      });
      res.json({ success: true, message: "Rate deleted" });
    } catch (err) { next(err); }
  },

  async assignOptionValues(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.assignOptionValues(req.params.id, req.body as AssignOptionValuesInput);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "variant",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "option_values_assigned", optionValueIds: req.body.optionValueIds },
      });
      res.json({ success: true, message: "Option values assigned" });
    } catch (err) { next(err); }
  },

  async removeOptionValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await variantService.removeOptionValue(req.params.id, req.params.optionValueId);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "variant",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "option_value_removed", optionValueId: req.params.optionValueId },
      });
      res.json({ success: true, message: "Option value removed" });
    } catch (err) { next(err); }
  },
};
