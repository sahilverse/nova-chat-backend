import type { Socket } from "socket.io";
import { setUserOnline, setUserOffline } from "./helpers";
import prisma from "../config/prisma";
import { MessageStatus } from "@prisma/client";

export const handleSocketConnection = async (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`🟢 ${user.email} connected`);

    try {
        await setUserOnline(user.id, socket.id);

        const userChats = await prisma.chatMember.findMany({
            where: { userId: user.id },
            select: { chatId: true },
        });


        userChats.forEach((chat) => {
            socket.join(chat.chatId);
        });


        const unreadMessages = await prisma.messageStatusEntry.findMany({
            where: { userId: user.id, status: MessageStatus.SENT },
            include: {
                message: {
                    include: {
                        sender: true,
                        chat: true,
                    },
                },
            },
        });

        // Process unread messages
        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map((entry) => entry.messageId);

            // Emit unread messages
            unreadMessages.forEach((entry) => {
                const event = entry.message.chat.isGroup ? "message:group" : "message:private"
                socket.emit(event, {
                    isSuccess: true,
                    status: "success",
                    message: "Unread message",
                    data: {
                        chatId: entry.message.chatId,
                        message: entry.message,
                    },
                })
            });

            // Batch update message statuses
            await prisma.messageStatusEntry.updateMany({
                where: {
                    messageId: { in: messageIds },
                    userId: user.id,
                    status: MessageStatus.SENT,
                },
                data: { status: MessageStatus.DELIVERED },
            });
        }

        socket.on("disconnect", async () => {
            console.log(`🔴 ${user.email} disconnected`);
            try {
                await setUserOffline(user.id);
            } catch (error) {
                console.error("Error setting user offline:", error);
            }
        });
    } catch (error) {
        console.error("Error in socket connection handler:", error);
        socket.disconnect();
    }
}
