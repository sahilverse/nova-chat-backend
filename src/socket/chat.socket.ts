import { Socket, Server } from "socket.io";
import { prisma } from "../config";



export class ChatSocket {
    constructor(private socket: Socket, private io: Server) {
        this.registerHandlers();
    }

    private registerHandlers = () => {

    };


}
