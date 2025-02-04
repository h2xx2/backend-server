import { Router } from 'express';
import userController from '../controllers/user-controller';
import {body} from 'express-validator';

const router = Router();

// Теперь можно напрямую использовать методы контроллера
router.post('/registration',
    body('email').isEmail(),
    userController.registration);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/users', userController.getUsers);

export default router;
