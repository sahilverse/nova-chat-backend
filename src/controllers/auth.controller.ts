import { Request, Response } from "express";
import { User } from "@prisma/client";
import { JwtUtils } from "../utils";
import { ResponseHandler } from "../utils";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config";
import { JWT_ACCESS_EXPIRATION_MINUTES, JWT_REFRESH_EXPIRATION_DAYS } from "../constants";
import { BcryptUtils } from "../utils";
import { loginSchema, registerSchema } from "../utils";
import { access } from "fs";
import { ZodError } from "zod";

class AuthController {

    // Refresh user access token
    static async refreshToken(req: Request, res: Response): Promise<any> {
        const clientType = req.headers["x-client-type"] as string;

        const token = clientType === 'web' ? req.cookies?.refresh_token : req.body?.refresh_token;

        if (!token) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Refresh token not provided");
        }

        let user: User | null;

        try {
            const { id } = await JwtUtils.verifyRefreshToken(token);

            user = await prisma.user.findUnique({ where: { id } });

            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "User not found");
            }

            await JwtUtils.revokeRefreshToken(token);
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or revoked refresh token");
        }

        const { password: _, ...userData } = user;

        const newAccessToken = JwtUtils.generateAccessToken(user);
        const { token: newRefreshToken } = await JwtUtils.generateRefreshToken(user);

        const refreshMaxAge = JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;



        if (clientType === "web") {
            res.cookie("refresh_token", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: refreshMaxAge,
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Tokens refreshed successfully", {
                access_token: newAccessToken,
                user: userData,
            });
        }

        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Tokens refreshed successfully", {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            user: userData,
        });
    }


    //  Register a new user
    static async registerUser(req: Request, res: Response): Promise<any> {
        const result = registerSchema.safeParse(req.body);


        if (!result.success) {
            return ResponseHandler.sendValidationError(res, result);
        }

        const { name, email, password } = result.data;

        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                return ResponseHandler.sendError(res, StatusCodes.CONFLICT, { "email": "Email already exists" });
            }

            const hashedPassword = await BcryptUtils.hashPassword(password);

            await prisma.user.create({
                data: { name, email, password: hashedPassword },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.CREATED, "User registered successfully");
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error registering user");
        }
    }

    // Login user
    static async loginUser(req: Request, res: Response): Promise<any> {
        const result = loginSchema.safeParse(req.body);
        const clientType = req.headers["x-client-type"] as string;

        if (!result.success) {
            return ResponseHandler.sendValidationError(res, result);
        }

        const { email, password } = result.data;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, { "email": "Email not found" });
            }

            if (!(await BcryptUtils.comparePassword(password, user.password!))) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, { "password": "Incorrect password" });
            }

            const accessToken = JwtUtils.generateAccessToken(user);
            const { token: refreshToken } = await JwtUtils.generateRefreshToken(user);

            const refreshMaxAge = JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;


            if (clientType !== "mobile") {
                res.cookie("refresh_token", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: refreshMaxAge,
                });

                return ResponseHandler.sendResponse(res, StatusCodes.OK, "Login successful", {
                    access_token: accessToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        profileImage: user.profileImage,
                    },
                });
            }

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Login successful", {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage,
                },
            });
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error logging in");
        }
    }

    // Logout user
    static async logoutUser(req: Request, res: Response): Promise<any> {
        const token = req.body?.refresh_token || req.cookies?.refresh_token;

        if (!token) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Refresh token not provided");
        }

        try {
            await JwtUtils.revokeRefreshToken(token);
        } catch (e) { }

        res.clearCookie("access_token");
        res.clearCookie("refresh_token");

        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Logout successful");
    }
}

export default AuthController;