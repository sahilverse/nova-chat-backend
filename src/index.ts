import "dotenv/config";
import app from "./app";
import prisma from "./config/prisma";
import { PORT } from "./constants";
import { createServer } from "http";
import { SocketManager } from "./config/socket.config";

const server = createServer(app);

async function bootstrap() {
    try {
        // Connect DB
        await prisma.$connect();
        console.log("✅ Connected to the database");

        // Init Socket.IO
        await SocketManager.init(server);
        console.log("✅ Socket.IO initialized");

        // start server
        server.listen(PORT, () => {
            console.log(`🚀 Server is running at http://localhost:${PORT}`);
        });

        // Handle graceful shutdown
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("❌ Startup failed:", error);
        process.exit(1);
    }
}

async function shutdown() {
    console.log("👋 Shutting down gracefully...");
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
