import { Chat, User, UserChat } from "@prisma/client";
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    isActive: boolean;
}


export type ChatWithMembersAndLastMessage = Chat & {
    members: (UserChat & { user: User })[];
    lastMessage: {
        id: string;
        content: string | null;
        createdAt: Date;
        sender: User | null;
        attachments: any[];
    } | null;
};

