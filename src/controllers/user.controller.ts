import { Request, Response } from "express";
import { User } from "@prisma/client";
import JwtUtils from "../utils/jwt";
import ResponseHandler from "../utils/responseHandler";
import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma";
import { JWT_ACCESS_EXPIRATION_MINUTES, JWT_REFRESH_EXPIRATION_DAYS } from "../constants";
import BcryptUtils from "../utils/bcrypt";
import { loginSchema, registerSchema } from "../utils/zod";


// Function to refresh - access and refresh tokens
export const refreshToken = async (req: Request, res: Response): Promise<any> => {
    const token = req.body?.refresh_token || req.cookies?.refresh_token;

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

    const accessMaxAge = JWT_ACCESS_EXPIRATION_MINUTES * 60 * 1000;
    const refreshMaxAge = JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: accessMaxAge,
    });

    res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: refreshMaxAge,
    });

    if (req.cookies?.refresh_token) {
        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Tokens refreshed successfully", userData);
    }

    return ResponseHandler.sendResponse(res, StatusCodes.OK, "Tokens refreshed successfully", {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: userData,
    });
};



// Register a new user
export const registerUser = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password } = registerSchema.parse(req.body);

    if (!name || !email || !password) {
        return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Name, email and password are required");
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        const hashedPassword = await BcryptUtils.hashPassword(password);

        if (existingUser) {
            return ResponseHandler.sendError(res, StatusCodes.CONFLICT, "User already exists");
        }

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return ResponseHandler.sendResponse(res, StatusCodes.CREATED, "User registered successfully");
    } catch (error) {
        return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error registering user");
    }
}


// Login a user
export const loginUser = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = loginSchema.parse(req.body);

    if (!email || !password) {
        return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Email and password are required");
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "User not found");
        }

        if (!(await BcryptUtils.comparePassword(password, user.password!))) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Incorrect password");
        }

        const accessToken = JwtUtils.generateAccessToken(user);
        const { token: refreshToken } = await JwtUtils.generateRefreshToken(user);

        const accessMaxAge = JWT_ACCESS_EXPIRATION_MINUTES * 60 * 1000;
        const refreshMaxAge = JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: accessMaxAge,
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: refreshMaxAge,
        });

        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Login successful", {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error logging in");
    }
};




// Logout a user
export const logoutUser = async (req: Request, res: Response): Promise<any> => {
    const token = req.body?.refresh_token || req.cookies?.refresh_token;

    if (!token) {
        return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Refresh token not provided");
    }

    if (token) {
        await JwtUtils.revokeRefreshToken(token);
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return ResponseHandler.sendResponse(res, StatusCodes.OK, "Logout successful");
};

