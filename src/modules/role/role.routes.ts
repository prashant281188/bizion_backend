import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { roleController } from "./role.controller";
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  createPermissionSchema,
  updatePermissionSchema,
  listRoleSchema,
  listPermissionSchema,
} from "./role.schema";

const router = Router();

/* ===== ROLES ===== */
router.get("/", authMiddleware, requirePermission("role:read"), validateSchema(listRoleSchema, "query"), roleController.listRoles);
router.get("/:id", authMiddleware, requirePermission("role:read"), roleController.getRoleById);
router.post("/", authMiddleware, requirePermission("role:create"), validateSchema(createRoleSchema), roleController.createRole);
router.patch("/:id", authMiddleware, requirePermission("role:update"), validateSchema(updateRoleSchema), roleController.updateRole);
router.delete("/:id", authMiddleware, requirePermission("role:delete"), roleController.removeRole);

/* ===== PERMISSION ASSIGNMENT ===== */
router.put("/:id/permissions", authMiddleware, requirePermission("role:update"), validateSchema(assignPermissionsSchema), roleController.assignPermissions);
router.delete("/:id/permissions/:permissionId", authMiddleware, requirePermission("role:update"), roleController.revokePermission);

/* ===== PERMISSIONS (managed under /roles/permissions) ===== */
router.get("/permissions/list", authMiddleware, requirePermission("role:read"), validateSchema(listPermissionSchema, "query"), roleController.listPermissions);
router.post("/permissions", authMiddleware, requirePermission("role:create"), validateSchema(createPermissionSchema), roleController.createPermission);
router.patch("/permissions/:id", authMiddleware, requirePermission("role:update"), validateSchema(updatePermissionSchema), roleController.updatePermission);
router.delete("/permissions/:id", authMiddleware, requirePermission("role:delete"), roleController.removePermission);

export default router;
