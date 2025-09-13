import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, RedisClientType } from "redis";
import socketAuth from "../middlewares/socket.middleware";
import { CLIENT_URL, REDIS_URL } from "../constants";

export class SocketManager {
    private static io: SocketIOServer;
    private static pubClient: RedisClientType;
    private static subClient: RedisClientType;

    static async init(server: HTTPServer): Promise<SocketIOServer> {
        if (this.io) return this.io;

        this.pubClient = createClient({ url: REDIS_URL });
        this.subClient = this.pubClient.duplicate();

        await this.pubClient.connect();
        await this.subClient.connect();

        this.io = new SocketIOServer(server, {
            cors: {
                origin: CLIENT_URL || "*",
                credentials: true,
            },
        });

        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        this.io.use(socketAuth);

        this.io.on("connection", (socket) => {
            console.log(`Socket connected: ${socket.id}`);
            socket.on("disconnect", () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });

        console.log("✅ Socket.IO Redis adapter initialized");
        return this.io;
    }

    static getIO(): SocketIOServer {
        if (!this.io) throw new Error("Socket.IO not initialized!");
        return this.io;
    }

    static async shutdown() {
        if (this.pubClient) this.pubClient.destroy();
        if (this.subClient) this.subClient.destroy();
        console.log("🛑 Redis clients disconnected");
    }
}
