import { Request, Response, NextFunction } from "express";
import { JwtUtils } from "../utils";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../utils";



export async function resetSessionMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Missing or invalid token");
    }

    const token = authHeader.split(" ")[1];

    try {
        const email = await JwtUtils.verifyResetPasswordSessionToken(token);
        req.resetUser = { email };
        next();
    } catch (error: any) {
        if (error.message.includes("expired")) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Reset session expired");
        }
        return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, error.message);
    }
}

