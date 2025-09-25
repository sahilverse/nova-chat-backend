import { Request, Response } from 'express';
import { prisma } from '../config';
import { ResponseHandler } from '../utils';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../utils';



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

    static async updateProfileImage(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            if (!req.file) return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, 'No file uploaded');


            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');


            const result = await CloudinaryService.uploadUserProfilePicture(userId, req.file.buffer, "profile_" + userId);

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    profileImage: result.secure_url,
                    profileImagePublicId: result.public_id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    createdAt: true,
                },
            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Profile picture updated successfully', { user: updatedUser });
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update profile picture');
        }
    }

    static async removeProfileImage(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');

            if (user.profileImagePublicId) {
                await CloudinaryService.deleteFile(user.profileImagePublicId, "image");
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    profileImage: null,
                    profileImagePublicId: null,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    createdAt: true,
                },

            });

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Profile picture removed successfully', { user: updatedUser });
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to remove profile picture');
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


    static async changeUsername(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { newName } = req.body;
            if (!userId) return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            const user = await prisma.user.update({
                where: { id: userId },
                data: { name: newName },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    createdAt: true,
                },
            });

            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Username changed successfully', { user });

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to change username');
        }
    }




}
