import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { handleSocketConnection } from '../socket';
import socketAuth from '../middlewares/socket.middleware';
import { handleTypingEvent } from '../socket/handlers/typingEvent.handler';
import { handlePrivateMessage } from '../socket/handlers/privateMessage.handler';
import { subscribeToChatMessages, cleanupRedisSubscriptions } from '../socket/utils/chat.pubsub';
import { subscribeToTypingEvents, cleanupTypingEvents } from '../socket/utils/typing.subscriber';

let io: SocketIOServer;

export const initSocketIO = (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            credentials: true,
        },
    });

    io.use(socketAuth);

    io.on('connection', (socket) => {
        handleSocketConnection(socket);
        handlePrivateMessage(io, socket);
        handleTypingEvent(io, socket);

    });

    Promise.all([subscribeToChatMessages(io), subscribeToTypingEvents(io)]).catch((error) => {
        console.error("Failed to initialize Redis subscribers:", error)
    })

    process.on("SIGTERM", async () => {
        console.log("Shutting down socket server...")
        await Promise.all([cleanupRedisSubscriptions(), cleanupTypingEvents()])
        io.close()
    })
};

