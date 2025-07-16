import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', UserController.getUsers);
router.get('/me', UserController.getUserProfile);
router.get('/:id', UserController.getUserById);


export default router;