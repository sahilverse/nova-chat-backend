// custom response handler
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';



export default class ResponseHandler {
    static sendResponse(res: Response, statusCode: StatusCodes, message: string, Result?: any) {
        return res.status(statusCode).json({
            StatusCode: statusCode,
            message,
            Result
        });
    }

    static sendError(res: Response, statusCode: StatusCodes, message: string) {
        return res.status(statusCode).json({
            StatusCode: statusCode,
            ErrorMessage: message
        });
    }
}

