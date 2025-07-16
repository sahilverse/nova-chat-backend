import { Router } from "express";
import AuthController from "../controllers/auth.controller";


const router = Router();

router.post("/token/refresh", AuthController.refreshToken);
router.post("/register", AuthController.registerUser);
router.post("/login", AuthController.loginUser);


export default router;