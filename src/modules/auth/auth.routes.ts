import { Router } from "express";
import { authController } from "./auth.controller";
import { validateSchema } from "../../middlewares/validateSchema";
import { authLimiter } from "../../middlewares/authRateLimit";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from "./auth.schema";
import { authMiddleware } from "../../middlewares/authMiddelware";

const router = Router();

/* ================= REGISTER ================= */

router.post(
  "/register",
  authLimiter,
  validateSchema(registerSchema),
  authController.register
);

/* ================= LOGIN ================= */

router.post(
  "/login",
  authLimiter,
  validateSchema(loginSchema),
  authController.login
);

/* ================= LOGOUT ================= */

router.post(
  "/logout",
  authController.logout
);

/* ================= CURRENT USER ================= */

router.get(
  "/me",
  authMiddleware,
  authController.me
);

/* ================= UPDATE PROFILE ================= */

router.patch(
  "/me",
  authMiddleware,
  validateSchema(updateProfileSchema),
  authController.updateProfile
);


router.post(
  "/forgot-password",
  authLimiter,
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/verify-otp",
  authLimiter,
  validateSchema(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  "/reset-password",
  authLimiter,
  validateSchema(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  "/change-password",
  authMiddleware,
  validateSchema(changePasswordSchema),
  authController.changePassword
);

export default router;
