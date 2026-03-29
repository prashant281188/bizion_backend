import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../config/db";
import { users } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { passwordResetTokens } from "../../db/schema/passwordResetToken";
import { sendEmail } from "../../services/email.service";
import { otpEmailTemplate, resetPasswordTemplate } from "../../utils/emailTemplates";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;
const OTP_EXPIRY_MINUTES = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const authService = {
  /* =====================================================
     REGISTER
  ===================================================== */

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
  }) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existing) throw new AppError("Email already registered", 409);

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashed,
        roleId: data.roleId,
      })
      .returning();

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /* =====================================================
     LOGIN
  ===================================================== */

  async login(data: { email: string; password: string; ip?: string }) {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, data.email), isNull(users.deletedAt)),
    });

    if (!user) throw new AppError("Invalid credentials", 401);

    if (!user.isActive) throw new AppError("Account is disabled", 403);

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${mins} minute(s)`, 423);
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_FAILED_ATTEMPTS;
      await db.update(users)
        .set({
          failedLoginAttempts: attempts,
          lockedUntil: locked
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : undefined,
        })
        .where(eq(users.id, user.id));

      if (locked) throw new AppError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes`, 423);
      throw new AppError("Invalid credentials", 401);
    }

    // Successful login — reset counters and record metadata
    await db.update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: data.ip ?? null,
      })
      .where(eq(users.id, user.id));

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async forgotPassword(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return null; // Don't reveal if user exists

    // Delete any existing OTP/token for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const tokenHash = crypto.createHash("sha256").update(otp).digest("hex");

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    await sendEmail({
      to: user.email,
      subject: "Your Password Reset OTP",
      html: otpEmailTemplate(otp),
    });
  },

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  async verifyOtp(email: string, otp: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) throw new AppError("Invalid OTP", 400);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const record = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.userId, user.id),
    });

    if (!record || record.tokenHash !== otpHash) throw new AppError("Invalid OTP", 400);

    if (record.expiresAt < new Date()) throw new AppError("OTP expired", 400);

    // OTP verified — replace with a short-lived reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.update(passwordResetTokens)
      .set({ tokenHash: resetTokenHash, expiresAt })
      .where(eq(passwordResetTokens.id, record.id));

    return rawToken;
  },

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.tokenHash, tokenHash),
    });

    if (!record) throw new AppError("Invalid or expired token", 400);

    if (record.expiresAt < new Date()) throw new AppError("Token expired", 400);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ password: hashed, passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null })
        .where(eq(users.id, record.userId));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));
    });
  },

  /* =====================================================
     CHANGE PASSWORD (AUTH REQUIRED)
  ===================================================== */

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new AppError("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid) throw new AppError("Current password incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.update(users)
      .set({ password: hashed, passwordChangedAt: new Date() })
      .where(eq(users.id, userId));
  },

  /* =====================================================
     UPDATE PROFILE (AUTH REQUIRED)
  ===================================================== */

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string | null; avatarUrl?: string | null }
  ) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new AppError("User not found", 404);

    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    const { password: _, ...safeUser } = updated;
    return safeUser;
  },

  /* =====================================================
     GET USER
  ===================================================== */

  async getById(id: string) {
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: { role: true },
    });

    if (!user) return null;

    const { password: _, ...safeUser } = user;
    return safeUser;
  },
};
