import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { unitService } from "./unit.service";
import { logAudit } from "../../services/audit.service";
import { ListUnitInput } from "./unit.schema";

export const unitController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await unitService.list(req.query as unknown as ListUnitInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await unitService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await unitService.create(req.body);
      await logAudit({ userId: req.user!.userId, action: "unit:create", entity: "unit", entityId: data.id });
      res.status(201).json({ success: true, message: "Unit created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await unitService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "unit:update", entity: "unit", entityId: data.id });
      res.json({ success: true, message: "Unit updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await unitService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "unit:delete", entity: "unit", entityId: req.params.id });
      res.json({ success: true, message: "Unit deleted" });
    } catch (err) { next(err); }
  },
};
