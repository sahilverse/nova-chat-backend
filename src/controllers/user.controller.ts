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
                    id: req.params.id,
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
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
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const after = req.query.after as string | undefined;

        try {
            const users = await prisma.user.findMany({
                take: limit,
                skip: after ? 1 : 0,
                cursor: after ? { id: after } : undefined,
                where: {
                    isActive: true,
                    ...(search && {
                        OR: [
                            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        ],
                    }),
                },
                orderBy: search
                    ? [
                        {
                            _relevance: {
                                fields: ["name", "email"],
                                search: search,
                                sort: "desc",
                            },
                        },
                        { id: "asc" },
                    ]
                    : { id: "asc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    lastSeen: true,
                },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, "Users fetched successfully", {
                users,
                nextCursor: users.length ? users[users.length - 1].id : null,
                hasNextPage: users.length === limit,
                limit,
            });
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch users");
        }
    }






}
