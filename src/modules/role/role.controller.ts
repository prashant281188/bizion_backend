import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { roleService } from "./role.service";
import { logAudit } from "../../services/audit.service";
import { ListPermissionInput, ListRoleInput } from "./role.schema";

export const roleController = {
  /* ===== ROLES ===== */

  async listRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await roleService.listRoles(req.query as unknown as ListRoleInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getRoleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.getRoleById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async createRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.createRole(req.body);
      await logAudit({ userId: req.user!.userId, action: "role:create", entity: "role", entityId: data.id });
      res.status(201).json({ success: true, message: "Role created", data });
    } catch (err) { next(err); }
  },

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.updateRole(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "role:update", entity: "role", entityId: data.id });
      res.json({ success: true, message: "Role updated", data });
    } catch (err) { next(err); }
  },

  async removeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.removeRole(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "role:delete", entity: "role", entityId: req.params.id });
      res.json({ success: true, message: "Role deleted" });
    } catch (err) { next(err); }
  },

  async assignPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.assignPermissions(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "role:permissions:assign", entity: "role", entityId: req.params.id });
      res.json({ success: true, message: "Permissions assigned" });
    } catch (err) { next(err); }
  },

  async revokePermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.revokePermission(req.params.id, req.params.permissionId);
      await logAudit({ userId: req.user!.userId, action: "role:permissions:revoke", entity: "role", entityId: req.params.id });
      res.json({ success: true, message: "Permission revoked" });
    } catch (err) { next(err); }
  },

  /* ===== PERMISSIONS ===== */

  async listPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await roleService.listPermissions(req.query as unknown as ListPermissionInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async createPermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.createPermission(req.body);
      await logAudit({ userId: req.user!.userId, action: "permission:create", entity: "permission", entityId: data.id });
      res.status(201).json({ success: true, message: "Permission created", data });
    } catch (err) { next(err); }
  },

  async updatePermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.updatePermission(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "permission:update", entity: "permission", entityId: data.id });
      res.json({ success: true, message: "Permission updated", data });
    } catch (err) { next(err); }
  },

  async removePermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.removePermission(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "permission:delete", entity: "permission", entityId: req.params.id });
      res.json({ success: true, message: "Permission deleted" });
    } catch (err) { next(err); }
  },
};
