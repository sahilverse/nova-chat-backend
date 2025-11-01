import { Attachment, Chat, User, UserChat, Message } from "@prisma/client";
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    profileImage: User['profileImage'];
    isActive: boolean;
}


export type ChatWithMembersAndLastMessage = Chat & {
    members: (UserChat & { user: User })[];
    lastMessage: {
        id: Message['id'];
        content: Message['content'];
        editedAt: Message['editedAt'];
        createdAt: Message['createdAt'];
        sender: User | null;
        attachments: Attachment[];
    } | null;
};

