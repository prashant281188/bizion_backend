// middleware/validateId.ts
import { NextFunction, Response, Request } from "express";
import z from "zod";

const uuidSchema = z.object({
    id: z.string().uuid({
        message: "invalid id"
    })
})

export function validateId(paramName: string = "id") {
    return (req: Request, res: Response, next: NextFunction) => {
        const parsedId = uuidSchema.safeParse({ id: req.params[paramName] });
        if (!parsedId.success) {
            return res.status(400).json({
                message: "Invalid ID",
                errors: parsedId.error.flatten().fieldErrors,
            });
        }
        next();
    };
}
