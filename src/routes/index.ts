import { Router } from "express";

import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import chatRoutes from "./chat.route";


const router = Router();

// Auth Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Chat Routes
router.use("/chats", chatRoutes);




export default router;