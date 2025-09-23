import "dotenv/config";
import app from "./app";
import { prisma } from "./config";
import { PORT } from "./constants";
import { createServer } from "http";
import { SocketManager } from "./config";
import { registerSocketHandlers } from "./socket";

const server = createServer(app);

async function bootstrap() {
    try {
        await prisma.$connect();
        console.log("✅ Connected to the database");

        // Socket.IO
        const io = await SocketManager.init(server);
        console.log("✅ Socket.IO initialized");

        // socket handlers
        registerSocketHandlers(io);

        server.listen(PORT, () => {
            console.log(`🚀 Server is running at http://localhost:${PORT}`);
        });

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("❌ Startup failed:", error);
        process.exit(1);
    }
}

async function shutdown() {
    console.log("Shutting down...");
    try {
        await SocketManager.shutdown();
        await prisma.$disconnect();

        server.close(() => {
            console.log("🛑 Server closed");
            process.exit(0);
        });
    } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
    }
}

bootstrap();
