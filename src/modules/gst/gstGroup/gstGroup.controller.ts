import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddelware";
import { gstGroupService } from "./gstGroup.service";
import { logAudit } from "../../../services/audit.service";
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
      await logAudit({ userId: req.user!.userId, action: "gst:group:create", entity: "gstGroup", entityId: data.id });
      res.status(201).json({ success: true, message: "GST group created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await gstGroupService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "gst:group:update", entity: "gstGroup", entityId: data.id });
      res.json({ success: true, message: "GST group updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await gstGroupService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "gst:group:delete", entity: "gstGroup", entityId: req.params.id });
      res.json({ success: true, message: "GST group deleted" });
    } catch (err) { next(err); }
  },
};
