import { NextFunction, Request, Response } from "express";
import { hsnService } from "./hsn.service";

export const hsnController = {
  /* ================= LIST ================= */

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.list(req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET BY ID ================= */

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CREATE ================= */

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= UPDATE ================= */

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hsnService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= DELETE ================= */

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hsnService.remove(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },
};
