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
            return res.error("Invalid Id", 404, parsedId.error.flatten().fieldErrors)
        }
        next();
    };
}
