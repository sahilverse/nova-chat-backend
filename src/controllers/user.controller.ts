import { Request, Response } from 'express';
import prisma from '../config/prisma';
import ResponseHandler from '../utils/responseHandler';
import { StatusCodes } from 'http-status-codes';


export default class UserController {
    static async getUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;

            if (!userId) return ResponseHandler.sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');

            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'User fetched successfully', user);
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user');
        }
    }

    static async getUserById(req: Request, res: Response): Promise<any> {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.params.id } });

            if (!user) return ResponseHandler.sendError(res, StatusCodes.NOT_FOUND, 'User not found');

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'User fetched successfully', user);

        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user');
        }
    }


    static async getUsers(req: Request, res: Response): Promise<any> {
        const search = req.query.search as string | undefined;

        let users;
        try {
            if (search) {
                users = await prisma.user.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                });
            } else {
                users = await prisma.user.findMany();
            }

            return ResponseHandler.sendResponse(res, StatusCodes.OK, 'Users fetched successfully', users);
        } catch (error) {
            return ResponseHandler.sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch users');
        }

    }



}
