import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { inventoryController } from "./inventory.controller";
import {
  adjustInventorySchema,
  createTransactionSchema,
  listInventorySchema,
  listTransactionSchema,
} from "./inventory.schema";

const router = Router();

/* ── Stock levels ────────────────────────────────────────────────────────── */
router.get(
  "/stock",
  authMiddleware,
  requirePermission("inventory:read"),
  validateSchema(listInventorySchema, "query"),
  inventoryController.listStock
);

router.get(
  "/stock/:variantId",
  authMiddleware,
  requirePermission("inventory:read"),
  inventoryController.getStockByVariant
);

router.post(
  "/stock/adjust",
  authMiddleware,
  requirePermission("inventory:update"),
  validateSchema(adjustInventorySchema),
  inventoryController.adjustStock
);

/* ── Transactions ────────────────────────────────────────────────────────── */
router.get(
  "/transactions",
  authMiddleware,
  requirePermission("inventory:read"),
  validateSchema(listTransactionSchema, "query"),
  inventoryController.listTransactions
);

router.post(
  "/transactions",
  authMiddleware,
  requirePermission("inventory:create"),
  validateSchema(createTransactionSchema),
  inventoryController.createTransaction
);

/* ── Dispatch hooks ──────────────────────────────────────────────────────── */
// Called after a dispatch is created (reserves stock)
router.post(
  "/hooks/dispatch/:dispatchId/created",
  authMiddleware,
  requirePermission("inventory:update"),
  inventoryController.onDispatchCreated
);

// Called when dispatch status → shipped or delivered (deducts stock)
router.post(
  "/hooks/dispatch/:dispatchId/shipped",
  authMiddleware,
  requirePermission("inventory:update"),
  inventoryController.onDispatchShipped
);

// Called when dispatch is cancelled (releases reservation)
router.post(
  "/hooks/dispatch/:dispatchId/cancelled",
  authMiddleware,
  requirePermission("inventory:update"),
  inventoryController.onDispatchCancelled
);

/* ── Purchase hooks ──────────────────────────────────────────────────────── */
// Called when a purchase order is confirmed (tracks ordered qty)
router.post(
  "/hooks/purchase-order/:orderId/confirmed",
  authMiddleware,
  requirePermission("inventory:update"),
  inventoryController.onPurchaseOrderConfirmed
);

// Called after a purchase receipt is saved (adds to on-hand stock)
router.post(
  "/hooks/purchase-receipt/:receiptId/received",
  authMiddleware,
  requirePermission("inventory:update"),
  inventoryController.onPurchaseReceiptCreated
);

export default router;
