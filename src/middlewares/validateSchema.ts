import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type RequestLocation = "body" | "query" | "params";

export const validateSchema =
  (schema: ZodSchema, location: RequestLocation = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[location]);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // ✅ Instead of reassigning, mutate existing object
    Object.assign(req[location], parsed.data);

    next();
  };
