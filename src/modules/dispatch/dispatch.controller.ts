import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { dispatchService } from "./dispatch.service";
import { CreateDispatchInput, ListDispatchInput } from "./dispatch.schema";

export const dispatchController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await dispatchService.list(req.query as unknown as ListDispatchInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await dispatchService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await dispatchService.create(req.body as CreateDispatchInput, req.user!.userId);
      res.status(201).json({ success: true, message: "Dispatch created", data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await dispatchService.remove(req.params.id);
      res.json({ success: true, message: "Dispatch deleted" });
    } catch (err) {
      next(err);
    }
  },
};
