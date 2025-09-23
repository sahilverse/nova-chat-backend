import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../utils/responseHandler";

export function createLimiter(max: number, windowMs: number, message?: string) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
            ResponseHandler.sendError(res, StatusCodes.TOO_MANY_REQUESTS, message || "Too many requests, please try again later."),
    });
}

export const forgotPasswordLimiter = createLimiter(
    5,
    15 * 60 * 1000
);

export const verifyOTPLimiter = createLimiter(
    3,
    10 * 60 * 1000
);

export const resetPasswordLimiter = createLimiter(
    3,
    15 * 60 * 1000
);


export const globalLimiter = createLimiter(
    5000,
    15 * 60 * 1000
);
