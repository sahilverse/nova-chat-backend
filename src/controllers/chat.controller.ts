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
                            sender: chat.lastMessage.sender,
                            attachments: chat.lastMessage.attachments
                        }
                        : null,
                    pinned: uc.pinned,
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
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, error as string);
        }
    }


    static async createOrGetPrivateChat(req: Request, res: Response): Promise<any> {
        try {
            const { otherUserId } = req.body;
            const currentUserId = req.user?.id;

            if (!otherUserId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, 'Other User ID is required');
            }

            const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });

            if (!otherUser) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');
            }

            const existingChat = await prisma.chat.findFirst({
                where: {
                    isGroup: false,
                    members: {
                        every: {
                            userId: { in: [otherUserId, currentUserId] }
                        }
                    }
                },
                include: {
                    members: {
                        select: {
                            user: {
                                select: {
                                    id: true, name: true, profileImage: true
                                }
                            }
                        }
                    },
                    lastMessage: {
                        include: { sender: { select: { id: true, name: true, profileImage: true } } }
                    }
                }
            });

            if (existingChat) {
                return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Chat fetched successfully', existingChat);
            }

            const chat = await prisma.chat.create({
                data: {
                    isGroup: false,
                    members: {
                        create: [
                            { userId: currentUserId },
                            { userId: otherUserId }
                        ]
                    },
                    createdBy: { connect: { id: currentUserId } }
                },
                include: {
                    members: {
                        select: {
                            user: { select: { id: true, name: true, profileImage: true } }
                        }
                    }
                }
            });

            return ResponseHandler.sendResponse(res, StatusCodes.CREATED, 'Chat created successfully', chat);

        } catch (error) {
            console.error('Error in createOrGetPrivateChat:', error);
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
        }
    }





}