import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { loginSchema, registerSchema, changePasswordSchema, resetPasswordSchema, verifyOTPSchema } from "../utils";
import { validateRequest } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { resetSessionMiddleware } from "../middlewares/resetSession.middleware";
import { forgotPasswordLimiter, verifyOTPLimiter, resetPasswordLimiter } from "../utils/limiter";


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/token/refresh:
 *   post:
 *     summary: Refresh user access token
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-client-type
 *         schema:
 *           type: string
 *         required: true
 *         description: Client type (web or mobile)
 *     requestBody:
 *       description: Refresh token for mobile clients
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized, invalid or missing token
 */
router.post("/token/refresh", AuthController.refreshToken);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request (missing fields)
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", validateRequest(registerSchema), AuthController.registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-client-type
 *         schema:
 *           type: string
 *         required: true
 *         description: Client type (web or mobile)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *       400:
 *         description: Bad request (missing fields)
 *       401:
 *         description: Unauthorized (invalid credentials)
 *       500:
 *         description: Internal server error
 */
router.post("/login", validateRequest(loginSchema), AuthController.loginUser);


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 * 
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized (invalid credentials)
 *       500:
 *         description: Internal server error
 */
router.post("/logout", AuthController.logoutUser);



/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password of the user
 *               newPassword:
 *                 type: string
 *                 description: New password (must meet complexity requirements)
 *               confirmNewPassword:
 *                 type: string
 *                 description: Must match newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StatusCode:
 *                   type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (validation failed)
 *       401:
 *         description: Unauthorized (incorrect current password or missing token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch("/change-password", authMiddleware, validateRequest(changePasswordSchema), AuthController.changePassword);



/** * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Initiate password reset process
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent to email
 *       400:
 *         description: Bad request (missing fields)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", forgotPasswordLimiter, AuthController.forgotPassword);


/**
 * @swagger
 * /auth/verify-reset-token:
 *   post:
 *     summary: Verify reset OTP token and get reset session JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token verified, reset session started
 *       400:
 *         description: Invalid or expired token
 */
router.post("/verify-reset-token", verifyOTPLimiter, validateRequest(verifyOTPSchema), AuthController.verifyResetToken);


/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset session JWT
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                type: string
 *                description: Must match newPassword
 *     responses:
 *       200:
 *         description: Password reset successful
 *       401:
 *         description: Unauthorized or expired session
 */
router.post("/reset-password", resetPasswordLimiter, resetSessionMiddleware, validateRequest(resetPasswordSchema), AuthController.resetPassword);

export default router;
