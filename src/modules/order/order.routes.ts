import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { orderController } from "./order.controller";
import {
  addItemSchema,
  createOrderSchema,
  listOrderSchema,
  nextOrderNumberSchema,
  updateOrderSchema,
  updateItemSchema,
} from "./order.schema";

const router = Router();

// Orders
router.get(
  "/next-number",
  authMiddleware,
  requirePermission("order:read"),
  validateSchema(nextOrderNumberSchema, "query"),
  orderController.nextNumber
);
router.get(
  "/",
  authMiddleware,
  requirePermission("order:read"),
  validateSchema(listOrderSchema, "query"),
  orderController.list
);
router.get(
  "/:id",
  authMiddleware,
  requirePermission("order:read"),
  orderController.getById
);
router.get(
  "/:id/balance",
  authMiddleware,
  requirePermission("order:read"),
  orderController.getBalance
);
router.post(
  "/",
  authMiddleware,
  requirePermission("order:create"),
  validateSchema(createOrderSchema),
  orderController.create
);
router.patch(
  "/:id",
  authMiddleware,
  requirePermission("order:update"),
  validateSchema(updateOrderSchema),
  orderController.update
);

// Items
router.post(
  "/:id/items",
  authMiddleware,
  requirePermission("order:update"),
  validateSchema(addItemSchema),
  orderController.addItem
);
router.patch(
  "/:id/items/:itemId",
  authMiddleware,
  requirePermission("order:update"),
  validateSchema(updateItemSchema),
  orderController.updateItem
);
router.delete(
  "/:id/items/:itemId",
  authMiddleware,
  requirePermission("order:update"),
  orderController.removeItem
);

export default router;
