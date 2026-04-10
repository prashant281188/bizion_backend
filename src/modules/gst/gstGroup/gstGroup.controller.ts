import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddleware";
import { gstGroupService } from "./gstGroup.service";
import { logAudit, getClientIp } from "../../../services/audit.service";
import { ListGstGroupInput } from "./gstGroup.schema";

export const gstGroupController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstGroupService.list(req.query as unknown as ListGstGroupInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstGroupService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstGroupService.create(req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "gstGroup",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: data,
      });
      res.status(201).json({ success: true, message: "GST group created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstGroupService.update(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "gstGroup",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "GST group updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await gstGroupService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "gstGroup",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "GST group deleted" });
    } catch (err) { next(err); }
  },
};
