import { Router } from "express";
import { categoryController } from "./category.controller";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import {
  listSchema,
  createSchema,
  updateSchema,
} from "./category.schema";
import { authMiddleware } from "../../middlewares/authMiddelware";

const router = Router();

/* ================= LIST ================= */

router.get(
  "/",
  authMiddleware,
  validateSchema(listSchema, "query"),
  requirePermission("category:read"),
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
  validateSchema(createSchema),
  requirePermission("category:create"),
  categoryController.create
);

/* ================= UPDATE ================= */

router.put(
  "/:id",
  authMiddleware,
  validateSchema(updateSchema),
  requirePermission("category:update"),
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
