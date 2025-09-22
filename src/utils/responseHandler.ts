// custom response handler
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSafeParseResult } from 'zod';



export default class ResponseHandler {
    static sendResponse(res: Response, statusCode: StatusCodes, message?: string, Result?: any) {
        return res.status(statusCode).json({
            StatusCode: statusCode,
            message,
            Result
        });
    }

    static sendError(res: Response, statusCode: StatusCodes, message?: string | Record<string, string>) {
        return res.status(statusCode).json({
            StatusCode: statusCode,
            ErrorMessage: message
        });
    }

    static sendValidationError(res: Response, result: ZodSafeParseResult<any>) {

        if (result.success) return;

        const errorMessage: Record<string, string> = {};
        let plainMessage = '';

        result.error.issues.forEach((err) => {
            const key = err.path.join('.');

            if (key) {
                errorMessage[key] = err.message;
            } else {
                plainMessage = err.message;
            }
        });

        if (plainMessage && Object.keys(errorMessage).length === 0) {
            return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, plainMessage);
        }

        return ResponseHandler.sendError(res, StatusCodes.BAD_REQUEST, errorMessage);

    }
}

