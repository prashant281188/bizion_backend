import { NextFunction, Response } from "express";
import { getPermissionsByRole } from "../services/permission.service";
import { AppError } from "./errorHandler";
import { AuthRequest } from "./authMiddelware";

export const requirePermission =
  (permission: string) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const permissions = await getPermissionsByRole(req.user.roleId);

    if (!permissions.includes(permission))
      throw new AppError("Forbidden", 403);

    next();
  };
