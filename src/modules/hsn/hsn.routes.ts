import { Router } from "express";
import { hsnController } from "./hsn.controller";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { listHsnSchema, createHsnSchema, updateHsnSchema } from "./hsn.schema";

const router = Router();

/* ================= LIST ================= */

router.get(
  "/",
  authMiddleware,
  requirePermission("hsn:read"),
  validateSchema(listHsnSchema, "query"),
  hsnController.list
);

/* ================= GET BY ID ================= */

router.get(
  "/:id",
  authMiddleware,
  requirePermission("hsn:read"),
  hsnController.getById
);

/* ================= CREATE ================= */

router.post(
  "/",
  authMiddleware,
  requirePermission("hsn:create"),
  validateSchema(createHsnSchema),
  hsnController.create
);

/* ================= UPDATE ================= */

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("hsn:update"),
  validateSchema(updateHsnSchema),
  hsnController.update
);

/* ================= DELETE ================= */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("hsn:delete"),
  hsnController.remove
);

export default router;
