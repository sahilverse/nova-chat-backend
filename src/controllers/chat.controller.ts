import { Request, Response } from 'express';
import { prisma } from '../config';
import { ResponseHandler } from '../utils';
import { StatusCodes } from 'http-status-codes';

import { paginate } from "../utils/pagination";
import { UserChat } from '@prisma/client';
import { ChatWithMembersAndLastMessage } from '../types/types';

export default class ChatController {

    static async getUserChats(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const limit = parseInt(req.query.limit as string);
            const cursor = req.query.cursor as string;

            const result = await paginate<UserChat & { chat: ChatWithMembersAndLastMessage }>(prisma.userChat, {
                where: {
                    userId,
                    deletedAt: null,
                },
                include: {
                    chat: {
                        select: {
                            id: true,
                            name: true,
                            isGroup: true,
                            groupImage: true,
                            updatedAt: true,
                            members: {
                                select: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            profileImage: true,
                                        },
                                    },
                                },
                            },
                            lastMessage: {
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    attachments: true,
                                    sender: {
                                        select: {
                                            id: true,
                                            name: true,
                                            profileImage: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { chat: { updatedAt: "desc" } },
            }, {
                limit,
                cursor
            }
            );

            const unreadCounts = await prisma.$queryRaw<
                { chatId: string; unreadCount: number }[]
            >`
                SELECT m."chatId", COUNT(m.id)::int AS "unreadCount"
                FROM "Message" m
                INNER JOIN "UserChat" uc
                ON uc."chatId" = m."chatId"
                AND uc."userId" = ${userId}
                WHERE m."senderId" != ${userId}
                AND (uc."lastReadAt" IS NULL OR m."createdAt" > uc."lastReadAt")
                GROUP BY m."chatId"
            `;

            const unreadCountMap = new Map(
                unreadCounts.map((u) => [u.chatId, u.unreadCount])
            );

            const chats = (result?.data).map((uc) => {
                const { chat } = uc;

                let displayName = chat.name;
                let displayImage = chat.groupImage;

                if (!chat.isGroup) {
                    const other = chat.members.find((m) => m.user.id !== userId)?.user;
                    displayName = other?.name ?? null;
                    displayImage = other?.profileImage ?? null;
                }


                return {
                    chatId: chat.id,
                    isGroup: chat.isGroup,
                    displayName,
                    displayImage,
                    lastMessage: chat.lastMessage
                        ? {
                            id: chat.lastMessage.id,
                            text: chat.lastMessage.content,
                            createdAt: chat.lastMessage.createdAt,
                            editedAt: chat.lastMessage.editedAt,
                            sender: {
                                id: chat.lastMessage.sender?.id,
                                name: chat.lastMessage.sender?.name,
                            },
                            hasAttachments: chat.lastMessage.attachments.length > 0,
                        }
                        : null,
                    archived: uc.archived,
                    unreadCount: unreadCountMap.get(chat.id) || 0,
                    updatedAt: chat.updatedAt,
                };
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chats fetched successfully", {
                data: chats,
                nextCursor: result.nextCursor,
                hasNextPage: result.hasNextPage,
                limit: result.limit,
            });

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }


    static async createOrGetPrivateChat(req: Request, res: Response): Promise<any> {
        try {
            const { otherUserId } = req.body;
            const currentUserId = req.user?.id;

            if (!otherUserId || !currentUserId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "User IDs are required");
            }


            const participantKey = [currentUserId, otherUserId].sort().join("_");


            const [otherUser, existingChat] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: { id: true, name: true, profileImage: true },
                }),
                prisma.chat.findUnique({
                    where: { participantKey },
                    include: {
                        lastMessage: {
                            include: {
                                sender: { select: { id: true, name: true, profileImage: true } },
                            },
                        },
                    },
                }),
            ]);

            if (!otherUser) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, "User not found");
            }

            // If chat already exists
            if (existingChat) {
                const { participantKey, name, description, groupImage, ...chat } = existingChat;

                return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chat fetched successfully", {
                    ...chat,
                    displayName: otherUser.name,
                    displayImage: otherUser.profileImage,
                });
            }

            // Create a new private chat
            const membersToCreate =
                currentUserId === otherUserId
                    ? [{ userId: currentUserId }]
                    : [{ userId: currentUserId }, { userId: otherUserId }];

            const chat = await prisma.chat.create({
                data: {
                    isGroup: false,
                    participantKey,
                    members: { create: membersToCreate },
                    createdBy: { connect: { id: currentUserId } },
                },
                select: {
                    id: true,
                    isGroup: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.CREATED, "Chat created successfully", {
                ...chat,
                displayName: otherUser.name,
                displayImage: otherUser.profileImage,
            });

        } catch (error) {
            console.error("Error in createOrGetPrivateChat:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }


    static async getChatById(req: Request, res: Response): Promise<any> {
        try {
            const { id: chatId } = req.params;
            const userId = req.user?.id;

            if (!chatId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat ID is required");
            }

            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const isMember = await prisma.userChat.findUnique({
                where: { chatId_userId: { chatId, userId } },
                select: { id: true },
            });

            if (!isMember) {
                return ResponseHandler.sendError(res, StatusCodes.FORBIDDEN, "Access denied");
            }

            const senderSelect = { id: true, name: true, profileImage: true };
            const INITIAL_MESSAGE_LIMIT = 10;

            const [chat, messages, pinnedMessages] = await Promise.all([
                prisma.chat.findUnique({
                    where: { id: chatId },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isGroup: true,
                        groupImage: true,
                        members: {
                            select: {
                                role: true,
                                user: { select: senderSelect },
                            },
                        },
                        lastMessage: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                                attachments: true,
                                sender: { select: senderSelect },
                            },
                        },
                    },
                }),

                prisma.message.findMany({
                    where: { chatId },
                    include: {
                        sender: { select: senderSelect },
                        attachments: true,
                        reactions: { select: { type: true, createdAt: true, userId: true } },
                        replyTo: { select: { id: true, content: true, sender: { select: { id: true, name: true } } } },
                        MessagePin: { select: { pinnedAt: true, userId: true } },
                    },
                    orderBy: { createdAt: "asc" },
                    take: INITIAL_MESSAGE_LIMIT,
                }),

                prisma.message.findMany({
                    where: { chatId, MessagePin: { some: {} } },
                    select: {
                        id: true,
                        content: true,
                        sender: { select: senderSelect },
                        attachments: true,
                        MessagePin: { select: { userId: true, pinnedAt: true } },
                    },
                    orderBy: { createdAt: "asc" },
                }),
            ]);

            if (!chat) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, "Chat not found");
            }

            const nextCursor = messages.length === INITIAL_MESSAGE_LIMIT
                ? messages[messages.length - 1].id
                : null;

            const response = {
                chat,
                messages,
                pinnedMessages,
                nextCursor
            };

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chat fetched successfully", response);

        } catch (error) {
            console.error("Error in getChatById:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }


    static async getChatMessages(req: Request, res: Response): Promise<any> {
        try {
            const { id: chatId } = req.params;
            const { cursor, limit } = req.query;
            const userId = req.user?.id;

            if (!chatId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat ID is required");
            }

            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const isMember = await prisma.userChat.findUnique({
                where: { chatId_userId: { chatId, userId } },
            });


            if (!isMember) {
                return ResponseHandler.sendError(res, StatusCodes.FORBIDDEN, "Access denied");
            }

            // Paginate messages
            const paginated = await paginate(
                prisma.message,
                {
                    where: { chatId },
                    include: {
                        sender: { select: { id: true, name: true, profileImage: true } },
                        attachments: {
                            select: {
                                id: true,
                                type: true,
                                url: true,
                                thumbnail: true,
                                fileSize: true,
                                duration: true,
                            },
                        },
                        reactions: {
                            select: {
                                type: true,
                                createdAt: true,
                                userId: true,
                            },
                        },
                        replyTo: {
                            select: {
                                id: true,
                                content: true,
                                sender: { select: { id: true, name: true } },
                            },
                        },
                        MessagePin: {
                            select: {
                                pinnedAt: true,
                                userId: true,
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" },
                },
                {
                    limit: Number(limit),
                    cursor: cursor ? String(cursor) : undefined,
                }
            );

            return ResponseHandler.sendResponse(
                res,
                StatusCodes.OK,
                "Messages fetched successfully",
                paginated
            );
        } catch (error) {
            console.error("Error in getChatMessages:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    static async deleteChatById(req: Request, res: Response): Promise<any> {

        try {
            const { id: chatId } = req.params;
            const userId = req.user?.id;

            if (!chatId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat ID is required");
            }

            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const isMember = await prisma.userChat.findUnique({
                where: { chatId_userId: { chatId, userId } },
            });

            if (!isMember) {
                return ResponseHandler.sendError(res, StatusCodes.FORBIDDEN, "Access denied");
            }

            if (isMember.deletedAt) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat already deleted");
            }

            await prisma.userChat.update({
                where: { chatId_userId: { chatId, userId } },
                data: { deletedAt: new Date() },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chat deleted successfully");
        } catch (error) {
            console.error("Error in deleteChat:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }


    static async archiveChatById(req: Request, res: Response): Promise<any> {
        try {
            const { id: chatId } = req.params;
            const userId = req.user?.id;

            if (!chatId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat ID is required");
            }

            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const isMember = await prisma.userChat.findUnique({
                where: { chatId_userId: { chatId, userId } },
            });

            if (!isMember) {
                return ResponseHandler.sendError(res, StatusCodes.FORBIDDEN, "Access denied");
            }

            if (isMember.archived) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat already archived");
            }

            if (isMember.deletedAt) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Cannot archive a deleted chat");
            }

            await prisma.userChat.update({
                where: { chatId_userId: { chatId, userId } },
                data: { archived: true },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chat archived successfully");
        } catch (error) {
            console.error("Error in archiveChat:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    static async unarchiveChatById(req: Request, res: Response): Promise<any> {
        try {
            const { id: chatId } = req.params;
            const userId = req.user?.id;

            if (!chatId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat ID is required");
            }

            if (!userId) {
                return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
            }

            const isMember = await prisma.userChat.findUnique({
                where: { chatId_userId: { chatId, userId } },
            });

            if (!isMember) {
                return ResponseHandler.sendError(res, StatusCodes.FORBIDDEN, "Access denied");
            }

            if (!isMember.archived) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, "Chat is not archived");
            }

            await prisma.userChat.update({
                where: { chatId_userId: { chatId, userId } },
                data: { archived: false },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Chat unarchived successfully");
        } catch (error) {
            console.error("Error in unarchiveChat:", error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

}
