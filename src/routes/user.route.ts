import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import upload from '../middlewares/multer.middleware';
import { validateFile, validateRequest } from '../middlewares/validation.middleware';
import { profileImageSchema, updateNameSchema } from '../utils';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users with optional search and cursor-based pagination
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to fetch per request
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Cursor (last user ID) from previous request
 *     responses:
 *       200:
 *         description: List of users with cursor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       profileImage:
 *                         type: string
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                 limit:
 *                   type: integer
 *                 hasNextPage:
 *                  type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', UserController.getUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the currently logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/me', UserController.getUserProfile);


/**
 * @swagger
 * /users/profile-image:
 *   patch:
 *     summary: Update user profile image
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []   
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (jpg, png, webp, max 4MB)
 *           required:
 *             - profileImage
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update profile picture
 */
router.patch(
    "/profile-image",
    upload.single("profileImage"),
    validateFile(profileImageSchema),
    UserController.updateProfileImage
);


/** * @swagger
 * /users/remove-profile-image:
 *   patch:
 *     summary: Remove user profile image
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image removed successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to remove profile picture
 */
router.patch(
    "/remove-profile-image",
    UserController.removeProfileImage
)


/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', UserController.getUserById);


/**
 * @swagger
 * /users/change-name:
 *   patch:
 *     summary: Change the currently logged-in user's name
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 description: The new name for the user
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch('/change-name', validateRequest(updateNameSchema), UserController.changeUsername);



/**
 * @swagger
 * /users/deactivate:
 *   patch:
 *     summary: Deactivate the currently logged-in user's account
 *     description: Marks the user account as inactive (soft delete). The user will no longer be able to log in until reactivated by an admin or support.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Account deactivated successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Failed to deactivate account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Failed to deactivate account
 */
router.patch('/deactivate', UserController.deactivateAccount);

export default router;
