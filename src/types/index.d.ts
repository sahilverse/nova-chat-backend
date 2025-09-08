import { User } from "@prisma/client";
import { AuthUser } from "./types";


declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}


declare module "socket.io" {
    interface Socket {
        user?: AuthUser;
    }
}