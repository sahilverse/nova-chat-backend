import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { loginSchema, registerSchema, resetPasswordSchema } from "../utils";
import { validateRequest } from "../middlewares/validation.middleware";


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
router.post("/forgot-password", AuthController.forgotPassword);


/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password using verification token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: Verification code sent to the user's email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword123!"
 *                 description: New password with uppercase, lowercase, number, and special character
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StatusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *                 Result:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Invalid token or token expired / Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StatusCode:
 *                   type: integer
 *                   example: 400
 *                 ErrorMessage:
 *                   type: object
 *                   example:
 *                     token: "Invalid or expired token"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StatusCode:
 *                   type: integer
 *                   example: 404
 *                 ErrorMessage:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StatusCode:
 *                   type: integer
 *                   example: 500
 *                 ErrorMessage:
 *                   type: string
 *                   example: "Error processing request"
 */
router.post("/reset-password", validateRequest(resetPasswordSchema), AuthController.resetPassword);

export default router;
