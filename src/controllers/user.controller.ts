import { Request, Response } from 'express';
import { prisma } from '../config';
import { ResponseHandler } from '../utils';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';



export default class UserController {
    static async getUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;

            if (!userId) return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    isActive: true,

                    createdAt: true,
                },
            });

            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');


            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'User fetched successfully', user);
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user');
        }
    }

    static async getUserById(req: Request, res: Response): Promise<any> {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.params.id
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    isActive: true,
                    lastSeen: true,
                }
            });

            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');


            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'User fetched successfully', user);

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user');
        }
    }


    static async getUsers(req: Request, res: Response): Promise<any> {
        const search = req.query.search as string | undefined;
        const limit = parseInt(req.query.limit as string) || 10;
        const after = req.query.after as string | undefined;

        try {
            const where = search
                ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
                : {};

            const users = await prisma.user.findMany({
                take: limit,
                skip: after ? 1 : 0,
                cursor: after ? { id: after } : undefined,
                where,
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    isActive: true,
                    lastSeen: true,
                },
            });

            const nextCursor = users.length ? users[users.length - 1].id : null;

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Users fetched successfully', {
                users,
                nextCursor,
                limit,
            });
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch users');
        }
    }




}
