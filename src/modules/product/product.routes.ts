import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { uploadImages } from "../../middlewares/upload";
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

/* ================= CREATE ================= */
// Accepts multipart/form-data. Product fields as form fields (variants as JSON string),
// plus optional files: productImage (single), variantImages (multiple, matched by index to variants array).

router.post(
  "/",
  authMiddleware,
  requirePermission("product:create"),
  uploadImages.fields([
    { name: "productImage", maxCount: 1 },
    { name: "variantImages", maxCount: 20 },
  ]),
  productController.create
);

/* ================= UPDATE ================= */
// Accepts multipart/form-data. Product fields as form fields,
// plus optional file: productImage (replaces existing image).

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("product:update"),
  uploadImages.fields([{ name: "productImage", maxCount: 1 }]),
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
