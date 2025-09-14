import { Socket } from "socket.io";
import { prisma } from "../config";
import { JwtUtils } from "../utils";

const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        let token = socket.handshake.auth?.token;
        if (!token && process.env.NODE_ENV !== "production") {
            token = socket.handshake.headers["token"] as string;
        }

        if (!token) {
            return next(new Error("Authentication token not provided"));
        }

        const { id } = JwtUtils.verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                isActive: true,
            },
        });

        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;

        return next();
    } catch (error) {
        console.error(
            "Socket auth error:",
            error instanceof Error ? error.message : "Unknown error"
        );
        return next(new Error("Invalid authorization token"));
    }
};

export default socketAuth;
