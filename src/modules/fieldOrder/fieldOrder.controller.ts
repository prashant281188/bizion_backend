import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { fieldOrderService } from "./fieldOrder.service";
import {
  AddItemInput,
  CreateFieldOrderInput,
  ListFieldOrderInput,
  UpdateFieldOrderInput,
  UpdateItemInput,
} from "./fieldOrder.schema";

export const fieldOrderController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await fieldOrderService.list(req.query as unknown as ListFieldOrderInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.create(
        req.body as CreateFieldOrderInput,
        req.user!.userId
      );
      res.status(201).json({ success: true, message: "Field order created", data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.update(
        req.params.id,
        req.body as UpdateFieldOrderInput
      );
      res.json({ success: true, message: "Field order updated", data });
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.addItem(req.params.id, req.body as AddItemInput);
      res.status(201).json({ success: true, message: "Item added", data });
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.updateItem(
        req.params.id,
        req.params.itemId,
        req.body as UpdateItemInput
      );
      res.json({ success: true, message: "Item updated", data });
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await fieldOrderService.removeItem(req.params.id, req.params.itemId);
      res.json({ success: true, message: "Item removed" });
    } catch (err) {
      next(err);
    }
  },

  async getEstimate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await fieldOrderService.getEstimate(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
