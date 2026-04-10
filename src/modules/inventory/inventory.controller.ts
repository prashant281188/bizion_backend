import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { inventoryService } from "./inventory.service";
import { logAudit, getClientIp } from "../../services/audit.service";
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
      const result = await inventoryService.listTransactions(req.query as unknown as ListTransactionInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = req.body as CreateTransactionInput;
      const data = await inventoryService.createTransaction(body);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "inventoryTransaction",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: { variantId: data.variantId, type: data.type, quantity: data.quantity, location: data.location },
      });
      res.status(201).json({ success: true, message: "Transaction recorded", data });
    } catch (err) {
      next(err);
    }
  },

  async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = req.body as AdjustInventoryInput;
      const data = await inventoryService.adjustStock(body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "inventory",
        entityLabel: `${body.variantId} @ ${body.location}`,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        before: { quantity: data.previousQuantity },
        after: { quantity: data.newQuantity, delta: data.delta },
        meta: { variantId: body.variantId, location: body.location },
      });
      res.json({ success: true, message: "Stock adjusted", data });
    } catch (err) {
      next(err);
    }
  },

  // ─── Dispatch hooks ───────────────────────────────────────────────────────

  async onDispatchCreated(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.onDispatchCreated(req.params.dispatchId);
      res.json({ success: true, message: "Stock reserved for dispatch" });
    } catch (err) {
      next(err);
    }
  },

  async onDispatchShipped(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.onDispatchShipped(req.params.dispatchId);
      res.json({ success: true, message: "Stock deducted for dispatch" });
    } catch (err) {
      next(err);
    }
  },

  async onDispatchCancelled(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.onDispatchCancelled(req.params.dispatchId);
      res.json({ success: true, message: "Reservation released for cancelled dispatch" });
    } catch (err) {
      next(err);
    }
  },

  // ─── Purchase hooks ───────────────────────────────────────────────────────

  async onPurchaseOrderConfirmed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.onPurchaseOrderConfirmed(req.params.orderId);
      res.json({ success: true, message: "Ordered qty updated for purchase order" });
    } catch (err) {
      next(err);
    }
  },

  async onPurchaseReceiptCreated(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.onPurchaseReceiptCreated(req.params.receiptId);
      res.json({ success: true, message: "Stock received and inventory updated" });
    } catch (err) {
      next(err);
    }
  },
};
