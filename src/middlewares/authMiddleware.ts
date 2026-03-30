import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { ENV } from "../config/env";

export interface AuthRequest extends Request {
  user?: { userId: string; roleId: string };
}

export const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) return next(new AppError("Unauthorized", 401));

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      roleId: string;
    };

    req.user = { userId: decoded.userId, roleId: decoded.roleId };

    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
};
