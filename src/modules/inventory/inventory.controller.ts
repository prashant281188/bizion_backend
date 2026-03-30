import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { inventoryService } from "./inventory.service";
import {
  AdjustInventoryInput,
  CreateTransactionInput,
  ListInventoryInput,
  ListTransactionInput,
} from "./inventory.schema";

export const inventoryController = {
  async listStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.listStock(req.query as unknown as ListInventoryInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getStockByVariant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.getStockByVariant(req.params.variantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.listTransactions(
        req.query as unknown as ListTransactionInput
      );
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.createTransaction(
        req.body as CreateTransactionInput
      );
      res.status(201).json({ success: true, message: "Transaction recorded", data });
    } catch (err) {
      next(err);
    }
  },

  async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.adjustStock(req.body as AdjustInventoryInput);
      res.json({ success: true, message: "Stock adjusted", data });
    } catch (err) {
      next(err);
    }
  },
};
