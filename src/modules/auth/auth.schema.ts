import { z } from "zod";

/* =====================================================
   COMMON VALIDATIONS
===================================================== */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[0-9]/, "Must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Must include at least one special character");

/* =====================================================
   REGISTER
===================================================== */

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  roleId: z.string().uuid("Invalid role ID"),
});

/* =====================================================
   LOGIN
===================================================== */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/* =====================================================
   FORGOT PASSWORD
===================================================== */

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/* =====================================================
   CHANGE PASSWORD (Authenticated)
===================================================== */

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: passwordSchema,
});

/* =====================================================
   RESET PASSWORD (Token Based)
===================================================== */

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: passwordSchema,
});

/* =====================================================
   TYPES (Optional but Recommended)
===================================================== */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
