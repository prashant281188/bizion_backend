import { Response } from "express";
import { userService } from "../../services/user.service";
import { logAudit } from "../../services/audit.service";
import { AppError } from "../../middlewares/errorHandler";
import { AuthRequest } from "../../middlewares/authMiddleware";

export const userController = {
  /* ================= LIST ================= */

  async list(req: AuthRequest, res: Response) {
    const data = await userService.list(req.query);

    res.json({ success: true, data });
  },

  /* ================= GET ================= */

  async getById(req: AuthRequest, res: Response) {
    const user = await userService.getById(req.params.id);

    if (!user)
      throw new AppError("User not found", 404);

    res.json({ success: true, data: user });
  },

  /* ================= CREATE ================= */

  async create(req: AuthRequest, res: Response) {
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
  },

  /* ================= UPDATE ================= */

  async update(req: AuthRequest, res: Response) {
    const updated = await userService.update(
      req.params.id,
      req.body
    );

    if (!updated)
      throw new AppError("User not found", 404);

    await logAudit({
      userId: req.user!.userId,
      action: "user:update",
      entity: "user",
      entityId: updated.id,
    });

    res.json({
      success: true,
      message: "User updated",
      data: updated,
    });
  },

  /* ================= DELETE ================= */

  async remove(req: AuthRequest, res: Response) {
    const deleted = await userService.remove(
      req.params.id
    );

    if (!deleted)
      throw new AppError("User not found", 404);

    await logAudit({
      userId: req.user!.userId,
      action: "user:delete",
      entity: "user",
      entityId: req.params.id,
    });

    res.json({
      success: true,
      message: "User deleted",
    });
  },
};
