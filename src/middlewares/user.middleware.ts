import { Request, Response, NextFunction } from "express";
import JwtUtils from "../utils/jwt";
import ResponseHandler from "../utils/responseHandler";
import prisma from "../utils/prisma";
import { JwtTokenPayload } from "../types/types";



export const userMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
        return ResponseHandler.sendError(res, 401, "Authorization token not provided");
    }

    try {
        const { id } = JwtUtils.verifyAccessToken(token) as JwtTokenPayload;


        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                password: false,
            }
        });

        if (!user) {
            return ResponseHandler.sendError(res, 401, "Authorization token is invalid");
        }

        req.user = user as JwtTokenPayload;
        next();
    } catch (error) {
        return ResponseHandler.sendError(res, 401, "Invalid authorization token");
    }
};