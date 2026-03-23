import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddelware";
import { gstRateService } from "./gstRate.service";
import { logAudit } from "../../../services/audit.service";
import { ListGstRateInput } from "./gstRate.schema";

export const gstRateController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstRateService.list(req.query as unknown as ListGstRateInput);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstRateService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstRateService.create(req.body);
      await logAudit({ userId: req.user!.userId, action: "gst:rate:create", entity: "gstRate", entityId: data.id });
      res.status(201).json({ success: true, message: "GST rate created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstRateService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "gst:rate:update", entity: "gstRate", entityId: data.id });
      res.json({ success: true, message: "GST rate updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await gstRateService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "gst:rate:delete", entity: "gstRate", entityId: req.params.id });
      res.json({ success: true, message: "GST rate deleted" });
    } catch (err) { next(err); }
  },
};
