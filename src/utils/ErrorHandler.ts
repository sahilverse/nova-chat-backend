import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "./responseHandler";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    ResponseHandler.sendError(
        res,
        err.status || StatusCodes.INTERNAL_SERVER_ERROR,
        err.message || "Internal Server Error"
    );
};

