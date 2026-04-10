import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { hsnService } from "./hsn.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { AssignGstGroupInput, ListHsnInput } from "./hsn.schema";

export const hsnController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await hsnService.list(req.query as unknown as ListHsnInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.create(req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "hsn",
        entityId: data.id,
        entityLabel: data.hsnCode,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.update(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "hsn",
        entityId: data.id,
        entityLabel: data.hsnCode,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await hsnService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "hsn",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async assignGstGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.assignGstGroup(req.params.id, req.body as AssignGstGroupInput);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "hsnGstHistory",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { hsnId: req.params.id, gstGroupId: data.gstGroupId, effectiveFrom: data.effectiveFrom },
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async removeGstHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await hsnService.removeGstHistory(req.params.id, req.params.historyId);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "hsnGstHistory",
        entityId: req.params.historyId,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { hsnId: req.params.id },
      });
      res.json({ success: true, message: "GST history entry removed" });
    } catch (err) {
      next(err);
    }
  },
};
