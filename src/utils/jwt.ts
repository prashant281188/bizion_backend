import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const generateToken = (payload: object) => {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" })
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, ENV.JWT_SECRET);
};
