import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { productController } from "./product.controller";
import { createProductSchema, listProductSchema, updateProductSchema } from "./product.schema";

const router = Router();

/* ================= LIST ================= */

router.get(
  "/",
  authMiddleware,
  requirePermission("product:read"),
  validateSchema(listProductSchema, "query"),
  productController.list
);

/* ================= GET BY ID ================= */

router.get(
  "/:id",
  authMiddleware,
  requirePermission("product:read"),
  productController.getById
);

/* ================= CREATE ================= */

router.post(
  "/",
  authMiddleware,
  requirePermission("product:create"),
  validateSchema(createProductSchema),
  productController.create
);

/* ================= UPDATE ================= */

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("product:update"),
  validateSchema(updateProductSchema),
  productController.update
);

/* ================= DELETE ================= */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("product:delete"),
  productController.remove
);

export default router;
