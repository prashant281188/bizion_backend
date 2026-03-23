import { NextFunction, Response } from "express";
import { logAudit } from "../../services/audit.service";
import { AppError } from "../../middlewares/errorHandler";
import { userService } from "./user.service";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { ListUserInput } from "./user.schema";

export const userController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      
      const data = await userService.list(req.query as unknown as ListUserInput);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /* ================= GET ================= */

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id);

      if (!user) throw new AppError("User not found", 404);

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);

      await logAudit({
        userId: req.user!.userId,
        action: "user:create",
        entity: "user",
        entityId: user.id,
      });

      res.status(201).json({
        success: true,
        message: "User created",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await userService.update(req.params.id, req.body);

      if (!updated) throw new AppError("User not found", 404);

      await logAudit({
        userId: req.user!.userId,
        action: "user:update",
        entity: "user",
        entityId: updated.id,
      });

      res.json({ success: true, message: "User updated", data: updated });
    } catch (err) {
      next(err);
    }
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await userService.remove(req.params.id);

      if (!deleted) throw new AppError("User not found", 404);

      await logAudit({
        userId: req.user!.userId,
        action: "user:delete",
        entity: "user",
        entityId: req.params.id,
      });

      res.json({ success: true, message: "User deleted" });
    } catch (err) {
      next(err);
    }
  },
};
