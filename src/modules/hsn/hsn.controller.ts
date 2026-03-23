import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { hsnService } from "./hsn.service";
import { logAudit } from "../../services/audit.service";
import { ListHsnInput } from "./hsn.schema";

export const hsnController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await hsnService.list(req.query as unknown as ListHsnInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET BY ID ================= */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.create(req.body);

      await logAudit({
        userId: req.user!.userId,
        action: "hsn:create",
        entity: "hsn",
        entityId: data.id,
      });

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.update(req.params.id, req.body);

      await logAudit({
        userId: req.user!.userId,
        action: "hsn:update",
        entity: "hsn",
        entityId: data.id,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await hsnService.remove(req.params.id);

      await logAudit({
        userId: req.user!.userId,
        action: "hsn:delete",
        entity: "hsn",
        entityId: req.params.id,
      });

      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },
};
