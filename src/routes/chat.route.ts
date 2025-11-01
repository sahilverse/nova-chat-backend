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




/**
 * @swagger
 * /chats/{id}/messages:
 *   get:
 *     summary: Get paginated messages for a specific chat
 *     description: Retrieve chat messages (with replies, attachments, and reactions) using cursor-based pagination.
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID to fetch messages from
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages to return per page
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last message from the previous request)
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           sender:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                   enum: [PHOTO, VIDEO, AUDIO]
 *                                 url:
 *                                   type: string
 *                           reactions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                 user:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                     name:
 *                                       type: string
 *                           replyTo:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               content:
 *                                 type: string
 *                               sender:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                     hasNextPage:
 *                       type: boolean
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Chat ID missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (user not a member of chat)
 *       500:
 *         description: Internal server error
 */
router.get('/:id/messages', chatController.getChatMessages);


export default router;