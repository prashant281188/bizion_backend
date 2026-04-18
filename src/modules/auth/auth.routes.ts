import { Router } from "express";
import { authController } from "./auth.controller";
import { validateSchema } from "../../middlewares/validateSchema";
import { authLimiter } from "../../middlewares/authRateLimit";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from "./auth.schema";

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────

// authLimiter: 5 requests / 15 min window, skips successful requests
// This guards against brute-force on registration and login

router.post(
  "/register",
  authLimiter,
  validateSchema(registerSchema),
  authController.register,
);

router.post(
  "/login",
  authLimiter,
  validateSchema(loginSchema),
  authController.login,
);

// Refresh does not need authMiddleware (access token may be expired),
// but rate-limited to prevent token farming / enumeration
router.post(
  "/refresh",
  authLimiter,
  authController.refresh,
);

// Logout does not require a valid access token — allows clients to clean up
// even after the access token has expired (the refresh cookie is used instead).
// Keep /refresh/logout as a backward-compatible endpoint for clients that still
// have a refresh cookie scoped to /api/v1/auth/refresh.
router.post("/logout", authController.logout);
router.post("/refresh/logout", authController.logout);

// ─── Password reset flow (public, rate-limited) ────────────────────────────────
// Step 1: submit email → receive OTP
// Step 2: submit email + OTP → receive short-lived reset token
// Step 3: submit reset token + new password → password updated

router.post(
  "/forgot-password",
  authLimiter,
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/verify-otp",
  authLimiter,
  validateSchema(verifyOtpSchema),
  authController.verifyOtp,
);

router.post(
  "/reset-password",
  authLimiter,
  validateSchema(resetPasswordSchema),
  authController.resetPassword,
);

// ─── Authenticated routes ─────────────────────────────────────────────────────

router.get(
  "/me",
  authMiddleware,
  authController.me,
);

router.patch(
  "/me",
  authMiddleware,
  validateSchema(updateProfileSchema),
  authController.updateProfile,
);

// Rate-limited: an attacker with a stolen access token should not be able to
// spam password changes for the 15-minute window the token is valid
router.post(
  "/change-password",
  authMiddleware,
  authLimiter,
  validateSchema(changePasswordSchema),
  authController.changePassword,
);

export default router;
