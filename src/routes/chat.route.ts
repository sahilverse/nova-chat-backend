import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat management endpoints
 */



/** * @swagger
 * /chats/private:
 *   post:
 *     summary: Create or get a private chat
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otherUserId:
 *                 type: string
 *                 description: ID of the user to chat with
 *     responses:
 *       200:
 *         description: Private chat created or retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/private', chatController.createOrGetPrivateChat);


/** * @swagger
 * /chats:
 *   get:
 *     summary: Get all chats for the authenticated user with pagination
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of chats to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Chats fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', chatController.getUserChats);


export default router;