import { Router } from "express";

import authRoutes from "./auth.route";
import userRoutes from "./user.route";


const router = Router();

// Auth Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);




export default router;