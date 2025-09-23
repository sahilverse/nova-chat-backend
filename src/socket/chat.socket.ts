import { Socket, Server } from "socket.io";
import { prisma } from "../config";
import { MessageType } from "@prisma/client";


interface MessagePayload {
    chatId: string;
    type: MessageType;
    content?: string;
    tempId?: string;
}

export class ChatSocket {
    constructor(private socket: Socket, private io: Server) {
        this.registerHandlers();
    }

    private registerHandlers = () => {

    };


}
