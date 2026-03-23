import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { users } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { passwordResetTokens } from "../../db/schema/passwordResetToken";
import { sendEmail } from "../../services/email.service";
import { resetPasswordTemplate } from "../../utils/emailTemplates";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

export const authService = {
  /* =====================================================
     REGISTER
  ===================================================== */

  async register(data: {
    email: string;
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
      .values({ email: data.email, password: hashed, roleId: data.roleId })
      .returning();

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /* =====================================================
     LOGIN
  ===================================================== */

  async login(data: { email: string; password: string }) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (!user) throw new AppError("Invalid credentials", 401);

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) throw new AppError("Invalid credentials", 401);

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

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html: resetPasswordTemplate(resetLink),
    });
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
      await tx.update(users).set({ password: hashed }).where(eq(users.id, record.userId));
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

    await db.update(users).set({ password: hashed }).where(eq(users.id, userId));
  },

  /* =====================================================
     GET USER
  ===================================================== */

  async getById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { role: true },
    });

    if (!user) return null;

    const { password: _, ...safeUser } = user;
    return safeUser;
  },
};
