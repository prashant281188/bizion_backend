import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { optionService } from "./option.service";
import { logAudit } from "../../services/audit.service";
import { ListOptionInput } from "./option.schema";

export const optionController = {
  /* ===== OPTIONS ===== */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await optionService.list(req.query as unknown as ListOptionInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await optionService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await optionService.create(req.body);
      await logAudit({ userId: req.user!.userId, action: "option:create", entity: "option", entityId: data.id });
      res.status(201).json({ success: true, message: "Option created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await optionService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "option:update", entity: "option", entityId: data.id });
      res.json({ success: true, message: "Option updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await optionService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "option:delete", entity: "option", entityId: req.params.id });
      res.json({ success: true, message: "Option deleted" });
    } catch (err) { next(err); }
  },

  /* ===== OPTION VALUES ===== */

  async addValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await optionService.addValue(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "option:value:create", entity: "optionValue", entityId: data.id });
      res.status(201).json({ success: true, message: "Option value added", data });
    } catch (err) { next(err); }
  },

  async updateValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await optionService.updateValue(req.params.id, req.params.valueId, req.body);
      await logAudit({ userId: req.user!.userId, action: "option:value:update", entity: "optionValue", entityId: data.id });
      res.json({ success: true, message: "Option value updated", data });
    } catch (err) { next(err); }
  },

  async removeValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await optionService.removeValue(req.params.id, req.params.valueId);
      await logAudit({ userId: req.user!.userId, action: "option:value:delete", entity: "optionValue", entityId: req.params.valueId });
      res.json({ success: true, message: "Option value deleted" });
    } catch (err) { next(err); }
  },
};
