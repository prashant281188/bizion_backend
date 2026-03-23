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

    // Shadow the prototype getter (e.g. req.query) with an own property
    // so the coerced/defaulted values are visible to downstream handlers.
    // Object.assign(req[location], ...) doesn't work for req.query because
    // Express defines it as a getter on the prototype — each access returns
    // a fresh object, so mutations are silently discarded.
    Object.defineProperty(req, location, {
      value: parsed.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };
