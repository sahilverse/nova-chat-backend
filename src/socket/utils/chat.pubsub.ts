import type { Server as SocketIOServer } from "socket.io";
import type { Message } from "@prisma/client";
import redis from "../../config/redisClient";
import { ChatMessagePayload } from "../../types/socket.types";


const CHANNEL_PREFIX = "chat:";
let subscriber: any = null;

// Publisher
export const publishChatMessage = async (chatId: string, senderSocketId: string, message: Message, isGroup = false,) => {
    try {
        const payload: ChatMessagePayload = {
            chatId,
            message,
            isGroup,
            senderSocketId
        }
        await redis.publish(`${CHANNEL_PREFIX}${chatId}`, JSON.stringify(payload));
    } catch (error) {
        console.error("Failed to publish message:", error);
        throw error;
    }
}

// Subscriber
export const subscribeToChatMessages = async (io: SocketIOServer) => {
    try {
        subscriber = redis.duplicate();
        await subscriber.connect();
        console.log("✅ Redis Chat Pub/Sub connected");

        subscriber.on("error", (error: Error) => {
            console.error("Redis subscriber error:", error);
        });

        subscriber.on("reconnecting", () => {
            console.log("Redis subscriber reconnecting...");
        });

        await subscriber.pSubscribe(`${CHANNEL_PREFIX}*`, async (message: string | Buffer) => {
            try {
                const msgStr = Buffer.isBuffer(message) ? message.toString('utf-8') : message;

                const { chatId, message: parsedMessage, isGroup, senderSocketId } = JSON.parse(msgStr);

                const event = isGroup ? "message:group" : "message:private";

                // Emit to all sockets in the chat room
                io.to(chatId)
                    .except(senderSocketId)
                    .emit(event, {
                        isSuccess: true,
                        status: "success",
                        message: "New message received",
                        data: {
                            chatId,
                            message: parsedMessage,
                        },
                    });
            } catch (parseError) {
                console.error("Error parsing Redis message:", parseError);
            }
        })
    } catch (error) {
        console.error("Failed to setup Redis subscriber:", error);
        throw error;
    }
}

// Cleanup function
export const cleanupRedisSubscriptions = async () => {
    if (subscriber) {
        try {
            await subscriber.pUnsubscribe();
            await subscriber.quit();
            subscriber = null;
            console.log("Redis subscriber cleaned up");
        } catch (error) {
            console.error("Error cleaning up Redis subscriber:", error);
        }
    }
}
