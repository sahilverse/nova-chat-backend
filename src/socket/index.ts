import { Server, Socket } from "socket.io";
import { ChatSocket } from "./chat.socket";

export const registerSocketHandlers = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Initialize chat socket handlers
        new ChatSocket(socket, io);

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
