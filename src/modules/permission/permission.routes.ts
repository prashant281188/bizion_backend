import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { permissionController } from "./permission.controller";
import { createPermissionSchema, listPermissionSchema, updatePermissionSchema } from "./permission.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("role:read"),
  validateSchema(listPermissionSchema, "query"),
  permissionController.list
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("role:read"),
  permissionController.getById
);

router.post(
  "/",
  authMiddleware,
  requirePermission("role:create"),
  validateSchema(createPermissionSchema),
  permissionController.create
);

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("role:update"),
  validateSchema(updatePermissionSchema),
  permissionController.update
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("role:delete"),
  permissionController.remove
);

export default router;
