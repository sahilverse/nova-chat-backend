import type { Socket, Server as SocketIOServer } from "socket.io";
import { createMessage, getSocketIdByUserId } from "../helpers";
import { type MessageType, MessageStatus, type Message } from "@prisma/client";
import { findOrCreatePrivateChat } from "../helpers";
import type { PrivateMessagePayload } from "../../types/socket.types";
import prisma from "../../config/prisma";
import SocketResponseHandler from "../utils/socketResponseHandler";
import { publishChatMessage } from "../utils/chat.pubsub";

export const PRIVATE_MESSAGE_EVENT = "message:private";

interface SuccessPayload {
    chatId: string
    message: Message
}

export const handlePrivateMessage = async (io: SocketIOServer, socket: Socket) => {
    socket.on(PRIVATE_MESSAGE_EVENT, async (payload: PrivateMessagePayload) => {
        const sender = socket.user;

        if (!sender) {
            return SocketResponseHandler.sendError(socket, PRIVATE_MESSAGE_EVENT, "Unauthorized");
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                const chat = await findOrCreatePrivateChat(sender.id, payload.toUserId);

                socket.join(chat.id)

                const message = (await createMessage({
                    chatId: chat.id,
                    senderId: sender.id,
                    content: payload.content,
                    type: payload.type as MessageType,
                    replyToId: payload.replyToId || null,
                })) as Message;

                // Create message status entry
                await tx.messageStatusEntry.create({
                    data: {
                        messageId: message.id,
                        userId: payload.toUserId,
                        status: MessageStatus.SENT,
                    },
                });

                return { chat, message };
            })


            SocketResponseHandler.sendSuccess<SuccessPayload>(socket, PRIVATE_MESSAGE_EVENT, "Message Sent Successfully", {
                chatId: result.chat.id,
                message: result.message,
            });

            await publishChatMessage(result.chat.id, socket.id, result.message);

            const recipientSocketId = await getSocketIdByUserId(payload.toUserId);

            if (recipientSocketId) {
                const recipientSocket = io.sockets.sockets.get(recipientSocketId);
                if (recipientSocket) {
                    recipientSocket.join(result.chat.id);
                };

                await prisma.messageStatusEntry.update({
                    where: {
                        messageId_userId: {
                            messageId: result.message.id,
                            userId: payload.toUserId,
                        },
                    },
                    data: { status: MessageStatus.DELIVERED },
                });
            }


        } catch (error) {
            console.error("Error handling private message:", error);
            SocketResponseHandler.sendError(socket, PRIVATE_MESSAGE_EVENT, "Failed to send message");
        }
    })
}
