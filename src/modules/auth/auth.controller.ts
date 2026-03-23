import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../middlewares/errorHandler";
import { authService } from "./auth.service";
import { AuthRequest } from "../../middlewares/authMiddelware";

export const authController = {
  /* ================= REGISTER ================= */

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  /* ================= LOGIN ================= */

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.login(req.body);

      const token = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      res.json({ success: true, message: "Login successful" });
    } catch (err) {
      next(err);
    }
  },

  /* ================= LOGOUT ================= */

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("token");
      res.json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CURRENT USER ================= */

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getById(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /* ================= FORGOT PASSWORD ================= */

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({
        success: true,
        message: "If email exists, reset link sent",
      });
    } catch (err) {
      next(err);
    }
  },

  /* ================= RESET PASSWORD ================= */

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
      next(err);
    }
  },

  /* ================= CHANGE PASSWORD ================= */

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ success: true, message: "Password changed" });
    } catch (err) {
      next(err);
    }
  },
};
