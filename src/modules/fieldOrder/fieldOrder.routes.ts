import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { fieldOrderController } from "./fieldOrder.controller";
import {
  addItemSchema,
  createFieldOrderSchema,
  listFieldOrderSchema,
  updateFieldOrderSchema,
  updateItemSchema,
} from "./fieldOrder.schema";

const router = Router();

// Orders
router.get(
  "/",
  authMiddleware,
  requirePermission("field_order:read"),
  validateSchema(listFieldOrderSchema, "query"),
  fieldOrderController.list
);
router.get(
  "/:id",
  authMiddleware,
  requirePermission("field_order:read"),
  fieldOrderController.getById
);
router.get(
  "/:id/estimate",
  authMiddleware,
  requirePermission("field_order:read"),
  fieldOrderController.getEstimate
);
router.post(
  "/",
  authMiddleware,
  requirePermission("field_order:create"),
  validateSchema(createFieldOrderSchema),
  fieldOrderController.create
);
router.patch(
  "/:id",
  authMiddleware,
  requirePermission("field_order:update"),
  validateSchema(updateFieldOrderSchema),
  fieldOrderController.update
);

// Items
router.post(
  "/:id/items",
  authMiddleware,
  requirePermission("field_order:update"),
  validateSchema(addItemSchema),
  fieldOrderController.addItem
);
router.patch(
  "/:id/items/:itemId",
  authMiddleware,
  requirePermission("field_order:update"),
  validateSchema(updateItemSchema),
  fieldOrderController.updateItem
);
router.delete(
  "/:id/items/:itemId",
  authMiddleware,
  requirePermission("field_order:update"),
  fieldOrderController.removeItem
);

export default router;
