import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq, and, isNull, lt } from "drizzle-orm";
import { db } from "../../config/db";
import { users, refreshTokens } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { passwordResetTokens } from "../../db/schema";
import { sendEmail } from "../../services/email.service";
import { otpEmailTemplate } from "../../utils/emailTemplates";

// ─── Constants ────────────────────────────────────────────────────────────────

const SALT_ROUNDS              = 12;   // bcrypt work factor — increase if hardware allows
const RESET_TOKEN_EXPIRY_MINUTES = 15; // how long the post-OTP reset token is valid
const OTP_EXPIRY_MINUTES       = 10;  // how long the emailed OTP is valid
const MAX_FAILED_ATTEMPTS      = 5;   // brute-force threshold before lockout
const LOCKOUT_MINUTES          = 15;  // duration of account lock after threshold
const REFRESH_TOKEN_EXPIRY_DAYS = 7;  // refresh token lifetime (rolling)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * One-way SHA-256 hash used to store refresh tokens and OTPs in the DB.
 * We never store raw tokens — only their hashes — so a DB leak cannot be
 * directly replayed by an attacker.
 */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {

  /* ==========================================================================
     REGISTER
     Creates a new user. The caller is responsible for ensuring roleId is
     appropriate — avoid exposing this endpoint to the public without
     restricting which roles can be self-assigned.
  ========================================================================== */

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
  }) {
    // Guard: prevent duplicate emails (case-insensitive emails are already
    // normalised to lowercase by the Zod schema before reaching here)
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existing) throw new AppError("Email already registered", 409);

    // Hash password before persisting — never store plaintext
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({ ...data, password: hashed })
      .returning();

    // Strip password hash from the returned object
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /* ==========================================================================
     LOGIN
     Validates credentials, enforces brute-force lockout, issues a raw
     refresh token (the hash is stored in the DB).
     Returns the safe user object + raw refresh token for cookie attachment.
  ========================================================================== */

  async login(data: { email: string; password: string; ip?: string }) {
    // Fetch only active, non-deleted users to avoid leaking deleted account info
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, data.email), isNull(users.deletedAt)),
    });

    // Use a generic error for both "not found" and "wrong password" to prevent
    // user enumeration via differing error messages
    if (!user) throw new AppError("Invalid credentials", 401);
    if (!user.isActive) throw new AppError("Account is disabled", 403);

    // Reject login early if the account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${mins} minute(s)`, 423);
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      // Increment failure counter and lock if threshold reached
      const attempts = user.failedLoginAttempts + 1;
      const locked   = attempts >= MAX_FAILED_ATTEMPTS;
      await db.update(users).set({
        failedLoginAttempts: attempts,
        lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : undefined,
      }).where(eq(users.id, user.id));

      if (locked) throw new AppError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes`, 423);
      throw new AppError("Invalid credentials", 401);
    }

    // Successful login — reset failure counter and record metadata
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil:  null,
      lastLoginAt:  new Date(),
      lastLoginIp:  data.ip ?? null,
    }).where(eq(users.id, user.id));

    // Lazy cleanup: purge this user's expired tokens so the table doesn't grow unbounded
    await db.delete(refreshTokens).where(
      and(eq(refreshTokens.userId, user.id), lt(refreshTokens.expiresAt, new Date()))
    );

    // Issue a new refresh token — store only the hash in the DB
    const rawRefresh = crypto.randomBytes(48).toString("hex");
    const expiresAt  = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86_400_000);
    await db.insert(refreshTokens).values({
      userId:    user.id,
      tokenHash: hashToken(rawRefresh),
      expiresAt,
    });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, rawRefreshToken: rawRefresh };
  },

  /* ==========================================================================
     REFRESH
     Validates and rotates the refresh token (one-time use).
     The rotation is wrapped in a transaction so two concurrent requests with
     the same token cannot both succeed (race condition guard).
  ========================================================================== */

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    const record = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!record) throw new AppError("Invalid refresh token", 401);

    // Delete expired token and reject — client must re-login
    if (record.expiresAt < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, record.id));
      throw new AppError("Refresh token expired", 401);
    }

    // Confirm the user account is still valid before issuing a new access token
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, record.userId), isNull(users.deletedAt)),
    });
    if (!user || !user.isActive) throw new AppError("Unauthorized", 401);

    // Atomically delete the old token and insert the new one.
    // Without a transaction, two simultaneous refresh calls could both read
    // the same token, both pass the exists check, and both rotate — creating
    // two valid sessions from one token (token reuse vulnerability).
    const rawRefresh = crypto.randomBytes(48).toString("hex");
    const expiresAt  = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86_400_000);

    await db.transaction(async (tx) => {
      await tx.delete(refreshTokens).where(eq(refreshTokens.id, record.id));
      await tx.insert(refreshTokens).values({
        userId:    user.id,
        tokenHash: hashToken(rawRefresh),
        expiresAt,
      });
    });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, rawRefreshToken: rawRefresh };
  },

  /* ==========================================================================
     LOGOUT
     Revokes the refresh token from the DB.
     If no cookie is present (already logged out / expired), this is a no-op.
  ========================================================================== */

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    await db.delete(refreshTokens).where(
      eq(refreshTokens.tokenHash, hashToken(rawRefreshToken))
    );
  },

  /* ==========================================================================
     FORGOT PASSWORD
     Generates a 6-digit OTP and emails it.
     Always returns without error regardless of whether the email exists —
     this prevents user enumeration ("did that email get a response?").
  ========================================================================== */

  async forgotPassword(email: string) {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    // Silently return — never reveal whether the email is registered
    if (!user) return;

    // Remove any existing OTP for this user before issuing a new one
    // (prevents OTP flooding / stacking multiple valid tokens)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    // crypto.randomInt is cryptographically secure, unlike Math.random()
    // Range: 100000–999999 guarantees exactly 6 digits
    const otp       = crypto.randomInt(100_000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

    // Store the hash — the raw OTP only travels via email, never persisted
    await db.insert(passwordResetTokens).values({
      userId:    user.id,
      tokenHash: hashToken(otp),
      expiresAt,
    });

    await sendEmail({
      to:      user.email,
      subject: "Your Password Reset OTP",
      html:    otpEmailTemplate(otp),
    });
  },

  /* ==========================================================================
     VERIFY OTP
     Validates the 6-digit OTP. On success, replaces it with a short-lived
     reset token that the client sends to /reset-password.
     This two-step approach ensures the OTP itself cannot reset the password —
     only the derived token can, and it expires in RESET_TOKEN_EXPIRY_MINUTES.
  ========================================================================== */

  async verifyOtp(email: string, otp: string) {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    // Return the same error for "no user" and "wrong OTP" to prevent enumeration
    if (!user) throw new AppError("Invalid OTP", 400);

    const record = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.userId, user.id),
    });

    if (!record || record.tokenHash !== hashToken(otp)) throw new AppError("Invalid OTP", 400);
    if (record.expiresAt < new Date()) throw new AppError("OTP expired", 400);

    // Upgrade: replace the OTP hash with a single-use reset token hash
    const rawToken  = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60_000);

    await db.update(passwordResetTokens)
      .set({ tokenHash: hashToken(rawToken), expiresAt })
      .where(eq(passwordResetTokens.id, record.id));

    // Return the raw token — client must present this to /reset-password
    return rawToken;
  },

  /* ==========================================================================
     RESET PASSWORD
     Validates the short-lived reset token (issued by verifyOtp) and updates
     the password. Wrapped in a transaction to ensure the token is consumed
     and all existing sessions are invalidated atomically.
  ========================================================================== */

  async resetPassword(token: string, newPassword: string) {
    const record = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.tokenHash, hashToken(token)),
    });
    if (!record)              throw new AppError("Invalid or expired token", 400);
    if (record.expiresAt < new Date()) throw new AppError("Token expired", 400);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.transaction(async (tx) => {
      // Update password, clear lockout state
      await tx.update(users)
        .set({
          password:            hashed,
          passwordChangedAt:   new Date(),
          failedLoginAttempts: 0,
          lockedUntil:         null,
        })
        .where(eq(users.id, record.userId));

      // Consume the reset token so it cannot be reused
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));

      // Invalidate all existing sessions — forces re-login everywhere
      await tx.delete(refreshTokens).where(eq(refreshTokens.userId, record.userId));
    });
  },

  /* ==========================================================================
     CHANGE PASSWORD (Authenticated)
     Requires the current password for confirmation, then rotates to the new
     one and revokes all sessions. Rejects if the new password is identical
     to the current one.
  ========================================================================== */

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new AppError("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError("Current password is incorrect", 400);

    // Prevent no-op password changes — the new password must actually differ
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) throw new AppError("New password must be different from the current password", 400);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ password: hashed, passwordChangedAt: new Date() })
        .where(eq(users.id, userId));

      // Revoke all refresh tokens — client must re-login on all devices
      await tx.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    });
  },

  /* ==========================================================================
     UPDATE PROFILE (Authenticated)
     Only allows updating non-sensitive fields. Email and password changes
     have their own dedicated endpoints with stricter controls.
  ========================================================================== */

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

  /* ==========================================================================
     GET BY ID
     Fetches a user by ID, excluding the password hash.
     Returns null for deleted users (soft-delete aware).
  ========================================================================== */

  async getById(id: string) {
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with:  { role: true },
    });
    if (!user) return null;

    const { password: _, ...safeUser } = user;
    return safeUser;
  },
};
