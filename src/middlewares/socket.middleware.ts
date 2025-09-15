import { Socket } from "socket.io";
import { prisma } from "../config";
import { JwtUtils } from "../utils";

const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        let token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("NO_TOKEN_PROVIDED"));
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
            return next(new Error("USER_NOT_FOUND"));
        }

        socket.user = user;

        return next();
    } catch (error) {
        console.error(
            "Socket auth error:",
            error instanceof Error ? error.message : "Unknown error"
        );
        return next(new Error("INVALID_TOKEN"));
    }
};

export default socketAuth;
