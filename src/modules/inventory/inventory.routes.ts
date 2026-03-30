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

/* ---- Stock levels ---- */
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

/* ---- Transactions ---- */
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

export default router;
