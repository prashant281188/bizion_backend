import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { gstRateService } from "./gstRate.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { ListGstRateInput } from "./gstRate.schema";

export const gstRateController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstRateService.list(req.query as unknown as ListGstRateInput);
      res.json({ success: true, data: result.items, meta: result.meta });
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
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "gstRate",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: data,
      });
      res.status(201).json({ success: true, message: "GST rate created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstRateService.update(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "gstRate",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "GST rate updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await gstRateService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "gstRate",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "GST rate deleted" });
    } catch (err) { next(err); }
  },
};
