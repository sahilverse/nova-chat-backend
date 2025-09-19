import { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);



        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
