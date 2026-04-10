import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { roleController } from "./role.controller";
import { assignPermissionsSchema, createRoleSchema, listRoleSchema, updateRoleSchema, updatePermissionsSchema } from "./role.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("role:read"), validateSchema(listRoleSchema, "query"), roleController.listRoles);
router.get("/:id", authMiddleware, requirePermission("role:read"), roleController.getRoleById);
router.post("/", authMiddleware, requirePermission("role:create"), validateSchema(createRoleSchema), roleController.createRole);
router.patch("/:id", authMiddleware, requirePermission("role:update"), validateSchema(updateRoleSchema), roleController.updateRole);
router.delete("/:id", authMiddleware, requirePermission("role:delete"), roleController.removeRole);

/* ===== PERMISSION ASSIGNMENT ===== */
// Replace all permissions for a role
router.put("/:id/permissions", authMiddleware, requirePermission("role:update"), validateSchema(assignPermissionsSchema), roleController.assignPermissions);
// Add / remove specific permissions without touching the rest
router.patch("/:id/permissions", authMiddleware, requirePermission("role:update"), validateSchema(updatePermissionsSchema), roleController.updatePermissions);
// Revoke a single permission
router.delete("/:id/permissions/:permissionId", authMiddleware, requirePermission("role:update"), roleController.revokePermission);

export default router;
