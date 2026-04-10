import { Router } from "express";
import { categoryController } from "./category.controller";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { uploadImages } from "../../middlewares/upload";
import {
  listCategorySchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

/* ================= LIST ================= */

router.get(
  "/",
  authMiddleware,
  requirePermission("category:read"),
  validateSchema(listCategorySchema, "query"),
  categoryController.list
);

/* ================= GET BY ID ================= */

router.get(
  "/:id",
  authMiddleware,
  requirePermission("category:read"),
  categoryController.getById
);

/* ================= CREATE ================= */

router.post(
  "/",
  authMiddleware,
  requirePermission("category:create"),
  uploadImages.single("categoryImage"),
  validateSchema(createCategorySchema),
  categoryController.create
);

/* ================= UPDATE ================= */

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("category:update"),
  uploadImages.single("categoryImage"),
  validateSchema(updateCategorySchema),
  categoryController.update
);

/* ================= DELETE ================= */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("category:delete"),
  categoryController.remove
);

export default router;
