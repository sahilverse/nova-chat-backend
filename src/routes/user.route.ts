import { Router } from "express";

import { refreshToken, loginUser, registerUser } from "../controllers/user.controller";


const router = Router();

router.post("/token/refresh", refreshToken);
router.post("/register", registerUser);
router.post("/login", loginUser);


export default router;