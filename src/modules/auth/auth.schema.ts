import { z } from "zod";

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

/**
 * Reusable email schema.
 * - .trim()        strips leading/trailing whitespace
 * - .toLowerCase() normalises case before DB storage/lookup so "User@A.com"
 *                  and "user@a.com" are treated as the same identity
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

/**
 * Reusable password strength schema.
 * Applied to new-password fields (register, reset, change).
 * NOT applied to the login password field — we want bcrypt to handle the
 * comparison there without blocking on schema details.
 */
const passwordSchema = z
  .string()
  .min(8,   "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/,        "Must include at least one uppercase letter")
  .regex(/[a-z]/,        "Must include at least one lowercase letter")
  .regex(/[0-9]/,        "Must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Must include at least one special character");

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName:  z.string().trim().min(1, "Last name is required").max(100),
  email:     emailSchema,
  // Loose international phone pattern — strict validation is country-specific
  phone:     z.string().trim().regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number").optional(),
  password:  passwordSchema,
  // The caller must supply a valid role UUID; the service trusts this value,
  // so ensure the register endpoint is not publicly accessible without controls
  roleId:    z.string().uuid("Invalid role ID"),
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  // Only check non-empty here — bcrypt.compare handles the real validation
  password: z.string().min(1, "Password is required"),
});

// ─── Forgot password ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyOtpSchema = z.object({
  email: emailSchema,
  // OTP is always exactly 6 numeric digits (100000–999999)
  otp:   z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

// ─── Reset password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  // The token is a 64-char hex string (32 random bytes) issued by verifyOtp
  token:       z.string().min(10, "Invalid reset token"),
  newPassword: passwordSchema,
});

// ─── Change password (authenticated) ─────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword:     passwordSchema,
});

// ─── Update profile (authenticated) ──────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName:  z.string().trim().min(1).max(100).optional(),
  lastName:   z.string().trim().min(1).max(100).optional(),
  phone:      z.string().trim().regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number").optional().nullable(),
  // Avatar URL is stored as an S3 key or full URL depending on upload strategy
  avatarUrl:  z.string().url("Invalid URL").optional().nullable(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput      = z.infer<typeof registerSchema>;
export type LoginInput         = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput     = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
