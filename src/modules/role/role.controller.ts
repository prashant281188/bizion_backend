import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { roleService } from "./role.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { ListRoleInput } from "./role.schema";

export const roleController = {
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
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "role",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json({ success: true, message: "Role created", data });
    } catch (err) { next(err); }
  },

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await roleService.updateRole(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "role",
        entityId: data.id,
        entityLabel: data.name,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Role updated", data });
    } catch (err) { next(err); }
  },

  async removeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.removeRole(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "role",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Role deleted" });
    } catch (err) { next(err); }
  },

  async updatePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.updatePermissions(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "role",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "permissions_updated", add: req.body.add, remove: req.body.remove },
      });
      res.json({ success: true, message: "Role permissions updated" });
    } catch (err) { next(err); }
  },

  async assignPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.assignPermissions(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "role",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "permissions_assigned", permissionIds: req.body.permissionIds },
      });
      res.json({ success: true, message: "Permissions assigned" });
    } catch (err) { next(err); }
  },

  async revokePermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.revokePermission(req.params.id, req.params.permissionId);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "role",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta: { trigger: "permission_revoked", permissionId: req.params.permissionId },
      });
      res.json({ success: true, message: "Permission revoked" });
    } catch (err) { next(err); }
  },
};
