import prisma from '../config/prisma';
import redis from '../config/redisClient';
import { CreateMessageInput } from '../types/socket.types';

export const getSocketIdByUserId = async (userId: string): Promise<string | null> => {
    return redis.get(`online:${userId}`);
};

export const setUserOnline = async (userId: string, socketId: string) => {
    await redis.set(`online:${userId}`, socketId, { EX: 60 * 60 * 24 }); // expire 1 day
};

export const setUserOffline = async (userId: string) => {
    await redis.del(`online:${userId}`);
};


// Function to find or create a private chat between two users
export const findOrCreatePrivateChat = async (userId1: string, userId2: string) => {
    let chat = await prisma.chat.findFirst({
        where: {
            isGroup: false,
            members: {
                some: { userId: userId1 },
            },
            AND: {
                members: {
                    some: { userId: userId2 },
                },
            },
        },
        include: {
            members: true,
        },
    });

    if (!chat) {
        // Create new private chat with both members
        chat = await prisma.chat.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: userId1 },
                        { userId: userId2 },
                    ],
                },
            },
            include: {
                members: true,
            },
        });
    }

    return chat;
};


// Create a message in the database
export const createMessage = async (input: CreateMessageInput) => {
    const { chatId, senderId, content, type, replyToId = null } = input;

    const message = await prisma.message.create({
        data: {
            chatId,
            senderId,
            content,
            type,
            replyToId,
        },
        include: {
            sender: true,
            reactions: true,
            replies: true,
            statuses: true,
        },
    });

    return message;
};



