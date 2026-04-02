import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { purchaseReceiptController } from "./purchaseReceipt.controller";
import { createPurchaseReceiptSchema, listPurchaseReceiptSchema } from "./purchaseReceipt.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("purchase_receipt:read"),
  validateSchema(listPurchaseReceiptSchema, "query"),
  purchaseReceiptController.list
);
router.get(
  "/:id",
  authMiddleware,
  requirePermission("purchase_receipt:read"),
  purchaseReceiptController.getById
);
router.post(
  "/",
  authMiddleware,
  requirePermission("purchase_receipt:create"),
  validateSchema(createPurchaseReceiptSchema),
  purchaseReceiptController.create
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("purchase_receipt:delete"),
  purchaseReceiptController.remove
);

export default router;
