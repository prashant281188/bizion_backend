import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authService } from "./auth.service";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { AppError } from "../../middlewares/errorHandler";
import { ENV } from "../../config/env";
import { logAudit, getClientIp } from "../../services/audit.service";

// ─── Token TTLs ───────────────────────────────────────────────────────────────

// Short-lived access token — kept small so a stolen token has a limited window
const ACCESS_TOKEN_TTL      = "15m";
// Refresh token lifetime in ms — must match REFRESH_TOKEN_EXPIRY_DAYS in service
const REFRESH_TOKEN_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/**
 * Sets the short-lived access token cookie.
 * httpOnly prevents JS access; secure + sameSite guard against CSRF in production.
 */
function setAccessCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure:   ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    path:     "/",
    maxAge:   15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Sets the long-lived refresh token cookie.
 * The path is scoped to /api/v1/auth so auth endpoints (refresh/logout) can
 * both access it, while still avoiding leakage to non-auth API routes.
 */
function setRefreshCookie(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure:   ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    path:     "/api/v1/auth",
    maxAge:   REFRESH_TOKEN_TTL_MS,
  });
}

/**
 * Clears both auth cookies.
 * Called on logout and on invalid/expired refresh token attempts.
 * Cookie options must mirror the set options exactly for the browser to delete them.
 */
function clearAuthCookies(res: Response) {
  const base = {
    httpOnly: true,
    secure:   ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" as const : "lax" as const,
  };
  res.clearCookie("token",         { ...base, path: "/" });
  res.clearCookie("refresh_token", { ...base, path: "/api/v1/auth" });
}

// ─── Controller ───────────────────────────────────────────────────────────────

export const authController = {

  /**
   * POST /auth/register
   * Creates a new user account. Email uniqueness is enforced in the service.
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      await logAudit({
        action:      "create",
        entity:      "user",
        entityId:    user.id,
        entityLabel: `${user.firstName} ${user.lastName}`,
        ipAddress:   getClientIp(req),
        userAgent:   req.headers["user-agent"],
        meta:        { trigger: "register" },
      });
      res.status(201).json({ success: true, message: "User registered successfully", data: user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/login
   * Validates credentials, enforces lockout, sets access + refresh cookies.
   * The response body intentionally does NOT include any token — cookies only.
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = getClientIp(req);
      const { user, rawRefreshToken } = await authService.login({ ...req.body, ip });

      // Sign a short-lived JWT containing only the minimal claims needed by middleware
      const accessToken = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        ENV.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
      );

      setAccessCookie(res, accessToken);
      setRefreshCookie(res, rawRefreshToken);

      await logAudit({
        userId:      user.id,
        action:      "login",
        entity:      "user",
        entityId:    user.id,
        entityLabel: user.email,
        ipAddress:   ip,
        userAgent:   req.headers["user-agent"],
      });

      res.json({ success: true, message: "Login successful" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/refresh
   * Validates the refresh token cookie and issues a new access token + rotated
   * refresh token. Both cookies are updated on success.
   *
   * On any 401 error (missing, invalid, or expired token) we MUST clear both
   * cookies — otherwise the client is stuck with stale cookies it cannot clear
   * on its own (httpOnly). The error is returned as JSON, not forwarded to the
   * global error handler, so the cookie-clearing happens before the response.
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refresh_token;

      // Treat a missing cookie as a 401 so the catch block clears cookies
      if (!rawRefreshToken) throw new AppError("No refresh token", 401);

      const { user, rawRefreshToken: newRawRefresh } = await authService.refresh(rawRefreshToken);

      const accessToken = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        ENV.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
      );

      setAccessCookie(res, accessToken);
      setRefreshCookie(res, newRawRefresh);

      res.json({ success: true, message: "Token refreshed" });
    } catch (err: any) {
      // AppError uses .statusCode (not .status) — check the correct property.
      // We handle 401s inline here (instead of passing to next()) so we can
      // clear the stale cookies before sending the response.
      if (err instanceof AppError && err.statusCode === 401) {
        clearAuthCookies(res);
        return res.status(401).json({ success: false, message: err.message });
      }
      next(err);
    }
  },

  /**
   * POST /auth/logout
   * Revokes the refresh token in the DB and clears both cookies.
   * Does not require a valid access token — allows logout even after access
   * token expiry. The refresh cookie is used for revocation.
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.cookies?.refresh_token);
      clearAuthCookies(res);

      await logAudit({
        userId:    req.user?.userId ?? null,
        action:    "logout",
        entity:    "user",
        entityId:  req.user?.userId ?? null,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   * Returns the authenticated user's profile (without password hash).
   */
  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getById(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/forgot-password
   * Sends a 6-digit OTP to the email if it's registered.
   * Always returns the same response regardless of whether the email exists
   * — prevents user enumeration.
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({ success: true, message: "If the email exists, an OTP has been sent" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/verify-otp
   * Validates the OTP and returns a short-lived reset token.
   * The client must present this token to /reset-password within
   * RESET_TOKEN_EXPIRY_MINUTES minutes.
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const token = await authService.verifyOtp(req.body.email, req.body.otp);
      res.json({ success: true, message: "OTP verified", data: { token } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/reset-password
   * Consumes the reset token and updates the password.
   * All existing sessions are invalidated after a successful reset.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      await logAudit({
        action:    "update",
        entity:    "user",
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta:      { trigger: "password_reset" },
      });
      res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/change-password
   * Requires current password confirmation. Rejects if new password is the
   * same as current. Clears cookies after success — client must re-login.
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      // Clear cookies — all sessions were revoked in the service layer
      clearAuthCookies(res);
      await logAudit({
        userId:    req.user!.userId,
        action:    "update",
        entity:    "user",
        entityId:  req.user!.userId,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta:      { trigger: "password_change" },
      });
      res.json({ success: true, message: "Password changed. Please log in again." });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /auth/me
   * Updates non-sensitive profile fields (name, phone, avatar).
   * Email and password changes are handled by dedicated endpoints.
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      await logAudit({
        userId:    req.user!.userId,
        action:    "update",
        entity:    "user",
        entityId:  req.user!.userId,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        meta:      { trigger: "profile_update" },
      });
      res.json({ success: true, message: "Profile updated", data: user });
    } catch (err) {
      next(err);
    }
  },
};
