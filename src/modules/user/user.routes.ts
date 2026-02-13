import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import {
  listSchema,
  createSchema,
  updateSchema,
} from "./user.schema";

const router = Router();

/* ================= LIST USERS ================= */

router.get(
  "/",
  authMiddleware,
  validateSchema(listSchema, "query"),
  requirePermission("user:read"),
  userController.list
);

/* ================= GET USER ================= */

router.get(
  "/:id",
  authMiddleware,
  requirePermission("user:read"),
  userController.getById
);

/* ================= CREATE USER ================= */

router.post(
  "/",
  authMiddleware,
  validateSchema(createSchema),
  requirePermission("user:create"),
  userController.create
);

/* ================= UPDATE USER ================= */

router.put(
  "/:id",
  authMiddleware,
  validateSchema(updateSchema),
  requirePermission("user:update"),
  userController.update
);

/* ================= DELETE USER ================= */

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("user:delete"),
  userController.remove
);

export default router;
