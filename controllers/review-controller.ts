import { Request, Response, NextFunction } from "express";
import {ReviewService} from "../service/review-service";
import {Multer} from "multer";

export default class ReviewController {
    static async createReview(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const { title, description } = req.body; // Получаем текстовые данные
            const userId = req.body.user?.id; // Получаем ID пользователя из данных, переданных middleware
            if (!userId) {
                return res.status(400).json({ message: "Нет данных о пользователе" });
            }

            const mediaFiles = req.files as Express.Multer.File[]; // Получаем файлы

            console.log("Полученные файлы:", mediaFiles);

            const review = await ReviewService.createReview(
                { user_id: userId, title, description },
                mediaFiles
            );

            res.status(201).json({ message: "Отзыв успешно добавлен", review });
        } catch (error) {
            next(error);
        }
    }


    static async getReviews(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const reviews = await ReviewService.getReviews();

            if (!reviews || reviews.length === 0) {
                return res.status(404).json({ message: "Отзывы не найдены" });
            }

            res.status(200).json({ data: reviews });
        } catch (error) {
            next(error); // Передача ошибки в middleware обработки ошибок
        }
    }
}
