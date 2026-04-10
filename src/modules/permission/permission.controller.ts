import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { permissionService } from "./permission.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { CreatePermissionInput, ListPermissionInput, UpdatePermissionInput } from "./permission.schema";

export const permissionController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await permissionService.list(req.query as unknown as ListPermissionInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await permissionService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await permissionService.create(req.body as CreatePermissionInput);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "permission",
        entityId: data.id,
        entityLabel: data.code,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: data,
      });
      res.status(201).json({ success: true, message: "Permission created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await permissionService.update(req.params.id, req.body as UpdatePermissionInput);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "permission",
        entityId: data.id,
        entityLabel: data.code,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Permission updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await permissionService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "permission",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Permission deleted" });
    } catch (err) { next(err); }
  },
};
