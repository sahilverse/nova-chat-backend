import { Socket } from 'socket.io';
import prisma from '../config/prisma';
import JwtUtils from '../utils/jwt';
import { JwtTokenPayload } from '../types/types';

const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication token not provided'));
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
            return next(new Error('Authorization token is invalid'));
        }


        (socket as any).user = user;
        next();
    } catch (error) {
        next(new Error('Invalid authorization token'));
    }
};


export default socketAuth;
