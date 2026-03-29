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
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: emailSchema,
  phone: z.string().trim().regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number").optional(),
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
   VERIFY OTP
===================================================== */

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

/* =====================================================
   RESET PASSWORD (Token Based)
===================================================== */

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: passwordSchema,
});

/* =====================================================
   UPDATE PROFILE (Authenticated)
===================================================== */

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number").optional().nullable(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
});

/* =====================================================
   TYPES (Optional but Recommended)
===================================================== */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
