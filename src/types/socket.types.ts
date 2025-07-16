import type { MessageType, Message } from "@prisma/client"

// Base typing payload
export interface TypingPayload {
    chatId: string
    isTyping: boolean
    fromUserId: string
}

// Enhanced typing payload (what we use internally with Redis)
export interface TypingEventPayload {
    chatId: string
    fromUserId: string
    senderSocketId: string
    timestamp: number
    ttl?: number
    isTyping?: boolean
}

export interface PrivateMessagePayload {
    toUserId: string
    content: string
    type: MessageType
    replyToId?: string | null
}

export interface CreateMessageInput {
    chatId: string
    senderId: string
    content: string
    type: MessageType
    replyToId?: string | null
}

export interface ChatMessagePayload {
    chatId: string
    isGroup: boolean
    message: Message
    senderSocketId: string
}
