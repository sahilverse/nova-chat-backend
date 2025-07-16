import type { Socket, Server as SocketIOServer } from "socket.io"
import type { TypingPayload, TypingEventPayload } from "../../types/socket.types"
import redis from "../../config/redisClient"

// Redis channels for typing events
const TYPING_CHANNEL_PREFIX = "typing:"
const STOP_TYPING_CHANNEL_PREFIX = "stop-typing:"

export const handleTypingEvent = (io: SocketIOServer, socket: Socket) => {
    socket.on("typing", async (payload: TypingPayload) => {
        try {
            const sender = (socket as any).user

            if (!sender || sender.id !== payload.fromUserId) {
                return;
            }

            const typingEventPayload: TypingEventPayload = {
                chatId: payload.chatId,
                fromUserId: payload.fromUserId,
                senderSocketId: socket.id,
                timestamp: Date.now(),
                ttl: 10,
                isTyping: true,
            }

            await redis.publish(`${TYPING_CHANNEL_PREFIX}${payload.chatId}`, JSON.stringify(typingEventPayload))


            socket.to(payload.chatId).emit("typing", {
                chatId: payload.chatId,
                fromUserId: payload.fromUserId,
                isTyping: true,
            })

            await trackTypingState(payload.fromUserId, socket.id, payload.chatId, true)
        } catch (error) {
            console.error("Error handling typing event:", error)
        }
    })

    socket.on("stop-typing", async (payload: TypingPayload) => {
        try {
            const sender = (socket as any).user

            if (!sender || sender.id !== payload.fromUserId) {
                return
            }

            const stopTypingEventPayload: TypingEventPayload = {
                chatId: payload.chatId,
                fromUserId: payload.fromUserId,
                senderSocketId: socket.id,
                timestamp: Date.now(),
                isTyping: false,
            }

            // Publish to Redis
            await redis.publish(`${STOP_TYPING_CHANNEL_PREFIX}${payload.chatId}`, JSON.stringify(stopTypingEventPayload))

            // Emit locally
            socket.to(payload.chatId).emit("stop-typing", {
                chatId: payload.chatId,
                fromUserId: payload.fromUserId,
                isTyping: false,
            })

            // Remove from active typing state
            await trackTypingState(payload.fromUserId, socket.id, payload.chatId, false)
        } catch (error) {
            console.error("Error handling stop typing event:", error)
        }
    })

    socket.on("disconnect", async () => {
        try {
            const sender = (socket as any).user
            if (sender) {
                await cleanupUserTypingState(sender.id, socket.id)
            }
        } catch (error) {
            console.error("Error cleaning up typing state:", error)
        }
    })
}

// Helper function to track typing state
const trackTypingState = async (userId: string, socketId: string, chatId: string, isTyping: boolean) => {
    try {
        const activeTypingKey = `active-typing:${userId}:${socketId}`

        if (isTyping) {
            await redis.sadd(activeTypingKey, chatId)
            await redis.expire(activeTypingKey, 15) // Expire in 15 seconds
        } else {
            await redis.srem(activeTypingKey, chatId)
        }
    } catch (error) {
        console.error("Error tracking typing state:", error)
    }
}

// Cleanup function for when user disconnects
const cleanupUserTypingState = async (userId: string, socketId: string) => {
    try {
        const activeTypingKey = `active-typing:${userId}:${socketId}`
        const activeChats = await redis.smembers(activeTypingKey) as string[] ?? [];

        for (const chatId of activeChats) {
            const stopPayload: TypingEventPayload = {
                chatId,
                fromUserId: userId,
                senderSocketId: socketId,
                timestamp: Date.now(),
                isTyping: false,
            }

            await redis.publish(`${STOP_TYPING_CHANNEL_PREFIX}${chatId}`, JSON.stringify(stopPayload))
        }

        // Clean up the tracking set
        await redis.del(activeTypingKey)
    } catch (error) {
        console.error("Error in cleanup:", error)
    }
}
