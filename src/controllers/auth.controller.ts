import { Request, Response } from "express";
import { JwtUtils } from "../utils";
import { ResponseHandler } from "../utils";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config";
import { CLIENT_URL, JWT_REFRESH_EXPIRATION_DAYS } from "../constants";
import { BcryptUtils } from "../utils";
import { sendEmail } from "../utils/email";
import crypto from "crypto";

class AuthController {

    // Refresh user access token
    static async refreshToken(req: Request, res: Response): Promise<any> {
        const clientType = req.headers["x-client-type"] as string;

        const token = clientType === 'web' ? req.cookies?.refresh_token : req.body?.refresh_token;

        if (!token) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Refresh token not provided");
        }

        let user;

        try {
            const { id } = await JwtUtils.verifyRefreshToken(token);

            user = await prisma.user.findUnique({
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
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "User not found");
            }

            await JwtUtils.revokeRefreshToken(token);
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or revoked refresh token");
        }

        const newAccessToken = JwtUtils.generateAccessToken(user.id);
        const { token: newRefreshToken } = await JwtUtils.generateRefreshToken(user.id);

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
                user
            });
        }

        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Tokens refreshed successfully", {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            user
        });
    }


    //  Register a new user
    static async registerUser(req: Request, res: Response): Promise<any> {

        const { name, email, password } = req.body;

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
        const clientType = req.headers["x-client-type"] as string;

        const { email, password } = req.body;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, { "email": "Email not found" });
            }

            if (!(await BcryptUtils.comparePassword(password, user.password!))) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, { "password": "Incorrect password" });
            }

            if (!user.isActive) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isActive: true },
                });
            }

            const accessToken = JwtUtils.generateAccessToken(user.id);
            const { token: refreshToken } = await JwtUtils.generateRefreshToken(user.id);

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
        const token = req.cookies?.refresh_token;

        res.clearCookie("refresh_token");

        if (token) {
            try {
                await JwtUtils.revokeRefreshToken(token);
            } catch (e) {
                console.error("Logout error (revoke failed):", e);
            }
        }


        return ResponseHandler.sendResponse(res, StatusCodes.OK, "Logout successful");
    }


    static async forgotPassword(req: Request, res: Response): Promise<any> {
        const { email } = req.body;

        if (!email) {
            return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, { "email": "Email is required" });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, { "email": "Email not found" });
            }

            const resetToken = crypto.randomInt(100000, 999999).toString();
            const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now


            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            const payload = { email, otp: resetToken };
            const jwtToken = JwtUtils.generatePasswordResetToken(payload);

            await prisma.user.update({
                where: { email },
                data: {
                    verificationCode: hashedToken,
                    verificationExpires: resetTokenExpiry
                }
            });

            const resetLink = `${CLIENT_URL}/accounts/reset-password?token=${jwtToken}`;

            const subject = "Password Reset Request";
            const html = `
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #4a4a4a;">Password Reset Verification Code - Nova Chat</h2>
                        <p>Your verification code is:</p>
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${resetToken}</h1>
                        
                        <p>Alternatively, you can reset your password by clicking the link below:</p>
                        <a href="${resetLink}" 
                        style="background: #007bff; color: #fff; padding: 10px 20px; 
                                text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                        </a>

                        <p>This code and link will expire in <strong>15 minutes</strong>.</p>
                        <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply to this email.</p>
                    </body>
                    </html>
        `;

            await sendEmail({
                to: email,
                subject,
                html
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Verification code sent to email");

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error processing request");
        }
    }


    static async verifyResetToken(req: Request, res: Response): Promise<any> {
        try {
            let emailValue: string;
            let otpValue: string;

            // ─── JWT FLOW ────────────────────────────────
            if (!req.body.email) {
                const { token } = req.body;

                try {
                    const payload = JwtUtils.verifyPasswordResetToken(token);

                    if (!payload.email || !payload.otp || payload.type !== 'password_reset') {
                        return ResponseHandler.sendError(
                            res,
                            StatusCodes.BAD_REQUEST,
                            { token: "Invalid token" }
                        );
                    }

                    emailValue = payload.email;
                    otpValue = payload.otp;

                } catch (error) {
                    return ResponseHandler.sendError(
                        res,
                        StatusCodes.BAD_REQUEST,
                        { token: "Invalid or expired token" }
                    );
                }

                // ─── OTP FLOW ────────────────────────────────
            } else {
                const { email, token } = req.body;
                emailValue = email;
                otpValue = token;
            }

            // ─── VERIFY USER ─────────────────────────────
            const user = await prisma.user.findUnique({
                where: { email: emailValue }
            });

            if (!user || !user.verificationCode || !user.verificationExpires) {
                return ResponseHandler.sendError(
                    res,
                    StatusCodes.BAD_REQUEST,
                    { token: "Invalid token" }
                );
            }

            if (user.verificationExpires < new Date()) {
                return ResponseHandler.sendError(
                    res,
                    StatusCodes.BAD_REQUEST,
                    { token: "Token has expired" }
                );
            }

            // ─── MATCH OTP ──────────────────────────────
            const hashedToken = crypto
                .createHash("sha256")
                .update(otpValue)
                .digest("hex");

            if (hashedToken !== user.verificationCode) {
                return ResponseHandler.sendError(
                    res,
                    StatusCodes.BAD_REQUEST,
                    { token: "Invalid token" }
                );
            }

            // ─── CLEAR USED OTP ─────────────────────────
            await prisma.user.update({
                where: { email: emailValue },
                data: {
                    verificationCode: null,
                    verificationExpires: null,
                },
            });

            // ─── ISSUE RESET JWT ────────────────────────
            const reset_token = JwtUtils.generateResetPasswordSessionToken(emailValue);

            return ResponseHandler.sendResponse(
                res,
                StatusCodes.OK,
                "Token verified successfully",
                { reset_token }
            );

        } catch (error) {
            return ResponseHandler.sendError(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Error processing request"
            );
        }
    }


    static async resetPassword(req: Request, res: Response): Promise<any> {
        const { newPassword } = req.body;
        const email = req.resetUser?.email;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, "User not found");
            }

            const hashedPassword = await BcryptUtils.hashPassword(newPassword);

            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Password reset successful");

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error processing request");
        }

    }


    static async changePassword(req: Request, res: Response): Promise<any> {
        const userId = req.user?.id;

        const { currentPassword, newPassword } = req.body;

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, "User not found");
            }

            if (!(await BcryptUtils.comparePassword(currentPassword, user.password!))) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, { "currentPassword": "Incorrect current password" });
            }

            const hashedPassword = await BcryptUtils.hashPassword(newPassword);

            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Password changed successfully");

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Error changing password");
        }

    }
}

export default AuthController;