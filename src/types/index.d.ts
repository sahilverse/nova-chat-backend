import { User } from "@prisma/client";
import { JwtTokenPayload } from "./types";


declare global {
    namespace Express {
        interface Request {
            user?: JwtTokenPayload;
        }
    }
}