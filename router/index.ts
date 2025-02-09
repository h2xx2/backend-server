import { Router } from 'express';
import userController from '../controllers/user-controller';
import reviewController from '../controllers/review-controller';
import {body} from 'express-validator';
import {verifyRefreshToken} from "../middleware/validateRefreshToken";

const router = Router();

// Теперь можно напрямую использовать методы контроллера
router.post('/registration',
    body('email').isEmail(),
    userController.registration);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);

router.post('/reviews', verifyRefreshToken,  reviewController.createReview);
router.get('/reviews', reviewController.getReviews);



export default router;
