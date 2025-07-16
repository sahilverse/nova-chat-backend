import type { Server as SocketIOServer } from "socket.io";
import redis from "../../config/redisClient";
import type { TypingEventPayload } from "../../types/socket.types";

let typingSubscriber: any = null;

export const subscribeToTypingEvents = async (io: SocketIOServer) => {
    try {
        typingSubscriber = redis.duplicate();
        await typingSubscriber.connect();
        console.log("✅ Typing events Redis subscriber connected");

        typingSubscriber.on("error", (error: Error) => {
            console.error("Typing subscriber error:", error);
        });

        await typingSubscriber.pSubscribe("typing:*", async (message: string | Buffer, channel: string) => {
            try {
                const msgStr = Buffer.isBuffer(message) ? message.toString('utf-8') : message;
                const payload: TypingEventPayload = JSON.parse(msgStr);
                const chatId = channel.replace("typing:", "");

                io.to(chatId).except(payload.senderSocketId).emit("typing", {
                    chatId: payload.chatId,
                    fromUserId: payload.fromUserId,
                });

                if (payload.ttl) {
                    const activeTypingKey = `active-typing:${payload.fromUserId}:${payload.senderSocketId}`;
                    await redis.sadd(activeTypingKey, chatId);
                    await redis.expire(activeTypingKey, payload.ttl);
                };
            } catch (error) {
                console.error("Error processing typing event:", error);
            }
        })

        // Subscribe to stop-typing events
        await typingSubscriber.pSubscribe("stop-typing:*", async (message: string | Buffer, channel: string) => {
            try {
                const msgStr = Buffer.isBuffer(message) ? message.toString('utf-8') : message;
                const payload: TypingEventPayload = JSON.parse(msgStr);
                const chatId = channel.replace("stop-typing:", "");


                io.to(chatId).except(payload.senderSocketId).emit("stop-typing", {
                    chatId: payload.chatId,
                    fromUserId: payload.fromUserId,
                })

                const activeTypingKey = `active-typing:${payload.fromUserId}:${payload.senderSocketId}`;
                await redis.srem(activeTypingKey, chatId);
            } catch (error) {
                console.error("Error processing stop-typing event:", error);
            }
        })
    } catch (error) {
        console.error("Failed to setup typing events subscriber:", error);
        throw error;
    }
}

// Cleanup function to unsubscribe and disconnect the subscriber
export const cleanupTypingEvents = async () => {
    if (typingSubscriber) {
        try {
            await typingSubscriber.pUnsubscribe();
            await typingSubscriber.quit();
            typingSubscriber = null;
            console.log("Typing subscriber cleaned up");
        } catch (error) {
            console.error("Error cleaning up typing subscriber:", error);
        }
    }
}
