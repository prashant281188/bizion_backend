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
  authMiddleware,
  authController.logout
);

/* ================= CURRENT USER ================= */

router.get(
  "/me",
  authMiddleware,
  authController.me
);


router.post(
  "/forgot-password",
  authLimiter,
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
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
