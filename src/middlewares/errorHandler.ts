import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";

/* ================= CUSTOM APP ERROR ================= */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode = 400,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

/* ================= ERROR HANDLER ================= */

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("❌ ERROR:", err);

  /* ---------- ZOD ---------- */
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      type: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
  }

  /* ---------- MULTER ---------- */
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      type: "FILE_UPLOAD_ERROR",
      message: err.message,
    });
  }

  /* ---------- JWT ---------- */
  if (
    err instanceof Error &&
    (err.name === "UnauthorizedError" ||
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError")
  ) {
    return res.status(401).json({
      success: false,
      type: "AUTH_ERROR",
      message: "Invalid or expired token",
    });
  }

  /* ---------- APP ERROR ---------- */
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      type: "APP_ERROR",
      message: err.message,
    });
  }

  /* ---------- GENERIC ERROR ---------- */
  if (err instanceof Error) {
    return res.status(500).json({
      success: false,
      type: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }

  /* ---------- FALLBACK ---------- */
  return res.status(500).json({
    success: false,
    type: "UNKNOWN_ERROR",
    message: "Something went wrong",
  });
};
