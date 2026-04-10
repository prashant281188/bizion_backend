import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { orderService } from "./order.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import {
  AddItemInput,
  CreateOrderInput,
  ListOrderInput,
  ListOrderItemsInput,
  ListOrderPartiesInput,
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

  async listItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.listItems(req.query as unknown as ListOrderItemsInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async listParties(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.listParties(req.query as unknown as ListOrderPartiesInput);
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
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "order",
        entityId: data.id,
        entityLabel: data.orderNumber,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: { orderNumber: data.orderNumber, orderType: data.orderType, totalAmount: data.totalAmount },
      });
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
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "order",
        entityId: data.id,
        entityLabel: data.orderNumber,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Order updated", data });
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await orderService.addItem(req.params.id, req.body as AddItemInput);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "order",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "item_added", itemId: data.id, sku: data.sku },
      });
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
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "order",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "item_updated", itemId: req.params.itemId },
      });
      res.json({ success: true, message: "Item updated", data });
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await orderService.removeItem(req.params.id, req.params.itemId);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "order",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "item_removed", itemId: req.params.itemId },
      });
      res.json({ success: true, message: "Item removed" });
    } catch (err) {
      next(err);
    }
  },
};
