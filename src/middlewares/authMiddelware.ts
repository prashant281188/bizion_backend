import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: { userId: string; roleId: string };
}

export const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) throw new AppError("Unauthorized", 401);
  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;

    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
    };

    next();
  }
  catch {
    return next(new AppError("Unauthorized", 401))
  }
};
