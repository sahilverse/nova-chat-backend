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
                            sender: {
                                id: chat.lastMessage.sender?.id,
                                name: chat.lastMessage.sender?.name,
                                profileImage: chat.lastMessage.sender?.profileImage,
                                isActive: chat.lastMessage.sender?.isActive
                            },
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
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }


    static async createOrGetPrivateChat(req: Request, res: Response): Promise<any> {
        try {
            const { otherUserId } = req.body;
            const currentUserId = req.user?.id;

            if (!otherUserId || !currentUserId) {
                return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, 'User IDs are required');
            }

            const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });

            if (!otherUser) {
                return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');
            }

            const existingChat = await prisma.chat.findUnique({
                where: {
                    participantKey: [currentUserId, otherUserId].sort().join('_')
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

            // Create chat
            const membersToCreate = currentUserId === otherUserId
                ? [{ userId: currentUserId }]
                : [{ userId: currentUserId }, { userId: otherUserId }];

            const chat = await prisma.chat.create({
                data: {
                    isGroup: false,
                    participantKey: [currentUserId, otherUserId].sort().join('_'),
                    members: {
                        create: membersToCreate
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