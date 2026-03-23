import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { brandService } from "./brand.service";
import { logAudit } from "../../services/audit.service";
import { ListBrandInput } from "./brand.schema";

export const brandController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await brandService.list(req.query as unknown as ListBrandInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await brandService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await brandService.create(req.body);
      await logAudit({ userId: req.user!.userId, action: "brand:create", entity: "brand", entityId: data.id });
      res.status(201).json({ success: true, message: "Brand created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await brandService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "brand:update", entity: "brand", entityId: data.id });
      res.json({ success: true, message: "Brand updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await brandService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "brand:delete", entity: "brand", entityId: req.params.id });
      res.json({ success: true, message: "Brand deleted" });
    } catch (err) { next(err); }
  },
};
