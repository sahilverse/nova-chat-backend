import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodSafeParseResult } from "zod";
import { ResponseHandler } from "../utils";



export const validateRequest = (schema: ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result: ZodSafeParseResult<any> = schema.safeParse(req.body);
        if (!result.success) {
            ResponseHandler.sendValidationError(res, result);
            return;
        }
        req.body = result.data;
        next();
    };
}


export const validateFile = (schema: ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const result: ZodSafeParseResult<any> = schema.safeParse(req.file);

        if (!result.success) {
            ResponseHandler.sendValidationError(res, result);
            return;
        }
        next();
    }
}