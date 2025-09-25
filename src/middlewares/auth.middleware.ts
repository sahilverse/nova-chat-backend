import { Request, Response, NextFunction } from "express";
import { JwtUtils } from "../utils";
import { ResponseHandler } from "../utils";
import { prisma } from "../config";
import { StatusCodes } from "http-status-codes";



export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    try {
        const { id } = JwtUtils.verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                isActive: true,
            },
        });


        if (!user) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
        }


        req.user = user;
        next();
    } catch (error) {
        return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
    }
};