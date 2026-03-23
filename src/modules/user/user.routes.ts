import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import {
  listUserSchema,
  createUserSchema,
  updateUserSchema,
} from "./user.schema";

const router = Router();

/* ================= LIST USERS ================= */

router.get(
  "/",
  authMiddleware,
  requirePermission("user:read"),
  validateSchema(listUserSchema, "query"),
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
  requirePermission("user:create"),
  validateSchema(createUserSchema),
  userController.create
);

/* ================= UPDATE USER ================= */

router.put(
  "/:id",
  authMiddleware,
  requirePermission("user:update"),
  validateSchema(updateUserSchema),
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
