import { Socket } from 'socket.io';
import { prisma } from '../config';
import { JwtUtils } from '../utils';
import { JwtTokenPayload } from '../types/types';

const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth?.token || !(process.env.NODE_ENV === 'production') && socket.handshake.headers.token;
        if (!token) {
            const error = new Error('Authentication token not provided');
            console.error('Socket auth error:', error.message);
            socket.disconnect();
            return next(error);

        }

        const { id } = JwtUtils.verifyAccessToken(token);


        const user: JwtTokenPayload | null = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            const error = new Error('User not found');
            console.error('Socket auth error:', error.message);
            socket.disconnect();
            return next(error);
        }


        socket.user = user;
        next();
    } catch (error) {
        console.error('Socket auth error:', error instanceof Error ? error.message : 'Unknown error');

        const authError = new Error('Invalid authorization token');
        socket.disconnect();
        next(authError);
    }
};


export default socketAuth;
