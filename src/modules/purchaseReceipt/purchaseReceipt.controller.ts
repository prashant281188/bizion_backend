import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { purchaseReceiptService } from "./purchaseReceipt.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { CreatePurchaseReceiptInput, ListPurchaseReceiptInput } from "./purchaseReceipt.schema";

export const purchaseReceiptController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await purchaseReceiptService.list(req.query as unknown as ListPurchaseReceiptInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReceiptService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await purchaseReceiptService.create(
        req.body as CreatePurchaseReceiptInput,
        req.user!.userId
      );
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "purchaseReceipt",
        entityId: data.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: { orderId: data.orderId, receivedDate: data.receivedDate },
      });
      res.status(201).json({ success: true, message: "Purchase receipt created", data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await purchaseReceiptService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "purchaseReceipt",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Purchase receipt deleted" });
    } catch (err) {
      next(err);
    }
  },
};
