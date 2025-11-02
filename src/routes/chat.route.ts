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


/** 
 * @swagger
 * /chats/{id}:
 *   delete:
 *     summary: Delete a chat by ID
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID of the chat to delete
 *   responses:
 *     200:
 *       description: Chat deleted successfully
 *     400:
 *       description: Chat ID is required
 *     401:
 *       description: Unauthorized
 *     403:
 *       description: Access denied
 *     404:
 *       description: Chat not found
 *     500:
 *       description: Internal server error
 */
router.delete('/:id', chatController.deleteChatById);


/**
 * @swagger
 * /chats/{id}/archive:
 *   patch:
 *     summary: Archive a chat by ID
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the chat to archive
 *     responses:
 *       200:
 *         description: Chat archived successfully
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
router.patch('/:id/archive', chatController.archiveChatById);


/**
 * @swagger
 * /chats/{id}/unarchive:
 *   patch:
 *     summary: Unarchive a chat by ID
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID of the chat to unarchive
 *     responses:
 *       200:
 *         description: Chat unarchived successfully
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
router.patch('/:id/unarchive', chatController.unarchiveChatById);


export default router;