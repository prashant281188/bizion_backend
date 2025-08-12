import { NextFunction, Request, Response } from "express";


export interface ApiResponse {
    success: boolean,
    message: string,
    data?: any,
    errors?: any,
    pagination?: any
}


declare global {
    namespace Express {
        interface Response {
            success: (
                message: string,
                data?: any,
                pagination?: any
            ) => Response;

            error: (
                message: string,
                statusCode?: number,
                errors?: any
            ) => Response;
        }
    }
}

export const responseHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.success = function (message, data, pagination) {
        return this.status(200).json({
            success: true,
            message,
            data,
            ...(pagination ? { pagination } : {})
        })
    }
    res.error = function (message, statusCode = 400, errors) {
        return this.status(statusCode).json({
            success: false,
            message,
            errors
        })
    }
    next();
}