import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { auditService } from "./audit.service";
import { ListAuditInput } from "./audit.schema";

export const auditController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await auditService.list(req.query as unknown as ListAuditInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await auditService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
