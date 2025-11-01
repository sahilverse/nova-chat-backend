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

/**
 * @swagger
 * /chats/{id}:
 *   get:
 *     summary: Get a specific chat by ID (including members, last message, and recent messages)
 *     description: |
 *       Retrieves detailed information about a chat including:
 *       - Chat metadata (name, description, image, group info)
 *       - Chat members and their roles
 *       - The last message (for preview)
 *       - The most recent 10 messages (for chat window)
 *       - Any pinned messages
 *       
 *       Requires the user to be a member of the chat.
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat to retrieve
 *     responses:
 *       200:
 *         description: Chat fetched successfully
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
 *                     chat:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         isGroup:
 *                           type: boolean
 *                         groupImage:
 *                           type: string
 *                         members:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role:
 *                                 type: string
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   profileImage:
 *                                     type: string
 *                         lastMessage:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             content:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             attachments:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   type:
 *                                     type: string
 *                                   url:
 *                                     type: string
 *                             sender:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 profileImage:
 *                                   type: string
 *                     messages:
 *                       type: array
 *                       description: Latest messages for the chat (ordered oldest → newest)
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
 *                                 url:
 *                                   type: string
 *                           reactions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                                 userId:
 *                                   type: string
 *                           replyTo:
 *                             type: object
 *                             nullable: true
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
 *                           MessagePin:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               pinnedAt:
 *                                 type: string
 *                                 format: date-time
 *                               userId:
 *                                 type: string
 *                     pinnedMessages:
 *                       type: array
 *                       description: All pinned messages in the chat
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                 url:
 *                                   type: string
 *                           sender:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           MessagePin:
 *                             type: object
 *                             properties:
 *                               pinnedAt:
 *                                 type: string
 *                                 format: date-time
 *                               userId:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                         limit:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       400:
 *         description: Chat ID is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', chatController.getChatById);


export default router;