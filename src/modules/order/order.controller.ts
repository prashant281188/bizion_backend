import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { orderService } from "./order.service";
import {
  AddItemInput,
  CreateOrderInput,
  ListOrderInput,
  NextOrderNumberInput,
  UpdateOrderInput,
  UpdateItemInput,
} from "./order.schema";

export const orderController = {
  async nextNumber(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderType } = req.query as unknown as NextOrderNumberInput;
      const data = await orderService.nextNumber(orderType);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.list(req.query as unknown as ListOrderInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.create(req.body as CreateOrderInput, req.user!.userId);
      res.status(201).json({ success: true, message: "Order created", data });
    } catch (err) {
      next(err);
    }
  },

  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getBalance(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.update(req.params.id, req.body as UpdateOrderInput);
      res.json({ success: true, message: "Order updated", data });
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.addItem(req.params.id, req.body as AddItemInput);
      res.status(201).json({ success: true, message: "Item added", data });
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.updateItem(
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
      await orderService.removeItem(req.params.id, req.params.itemId);
      res.json({ success: true, message: "Item removed" });
    } catch (err) {
      next(err);
    }
  },
};
