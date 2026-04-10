import { NextFunction, Response } from "express";
import { logAudit, getClientIp } from "../../services/audit.service";
import { userService } from "./user.service";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { ListUserInput } from "./user.schema";

export const userController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.list(req.query as unknown as ListUserInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "user",
        entityId: user.id,
        entityLabel: `${user.firstName} ${user.lastName}`,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        after: user,
      });
      res.status(201).json({ success: true, message: "User created", data: user });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await userService.update(req.params.id, req.body);
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "user",
        entityId: updated.id,
        entityLabel: `${updated.firstName} ${updated.lastName}`,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "User updated", data: updated });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await userService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "user",
        entityId: req.params.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "User deleted" });
    } catch (err) {
      next(err);
    }
  },
};
