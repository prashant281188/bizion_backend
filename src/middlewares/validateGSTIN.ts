/**
 * middleware/validateGSTIN.ts
 * ───────────────────────────
 * Express middleware that validates a GSTIN coming from either:
 *   • req.params.gstin  (GET /api/gstin/:gstin)
 *   • req.body.gstin    (POST /api/gstin)
 *
 * On invalid input it sends a 400 JSON response and stops the chain.
 * On valid input it normalises req.params.gstin / req.body.gstin to uppercase
 * and calls next().
 */

import { Request, Response, NextFunction } from "express";
import { validateGSTIN } from "../services/gstService";

export function validateGSTINMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prefer params (GET) then body (POST)
  const raw: string = (req.params.gstin ?? req.body?.gstin ?? "")
    .toString()
    .trim()
    .toUpperCase();

  const error = validateGSTIN(raw);

  if (error) {
    res.status(400).json({ success: false, error });
    return;
  }

  // Write back the normalised value so route handlers don't need to repeat it
  if (req.params.gstin) req.params.gstin = raw;
  if (req.body?.gstin !== undefined) req.body.gstin = raw;

  next();
}
