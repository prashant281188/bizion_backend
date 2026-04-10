import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { partyService } from "./party.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { CreatePartyInput, ListPartyInput, UpdatePartyInput } from "./party.schema";

export const partyController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await partyService.list(req.query as unknown as ListPartyInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await partyService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await partyService.create(req.body as CreatePartyInput);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "party",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: data,
      });
      res.status(201).json({ success: true, message: "Party created", data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await partyService.update(req.params.id, req.body as UpdatePartyInput);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "party",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Party updated", data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await partyService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "party",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Party deleted" });
    } catch (err) {
      next(err);
    }
  },
};
