import { User } from "@prisma/client";
import { AuthUser } from "./types";


declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            file?: Express.Multer.File;
            resetUser?: { email: string };
        }
    }
}


declare module "socket.io" {
    interface Socket {
        user?: AuthUser;
    }
}