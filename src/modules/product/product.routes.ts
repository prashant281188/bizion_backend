import { Router } from "express";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { productController } from "./product.controller";
import { listProductSchema } from "./product.schema";

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

export default router;
