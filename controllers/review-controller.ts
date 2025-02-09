import { Request, Response } from "express";
import { ReviewService } from "../service/review-service";

export default class ReviewController {
    static async createReview(req: Request, res: Response) {
        try {
            const { title, description, mediaFiles } = req.body;
            const userId = req.body.user.id; // ID пользователя из токена

            // Вызов статического метода createReview из ReviewService
            const review = await ReviewService.createReview({
                user_id: userId,
                title,
                description
            }, mediaFiles);

            res.status(201).json({ message: "Отзыв успешно добавлен", review });
        } catch (error) {
            res.status(500).json({ message: "Ошибка сервера", error });
        }
    }

    static async getReviews(req: Request, res: Response) {
        try {
            const reviews = await ReviewService.getReviews();
            res.status(200).json(reviews);
        } catch (error) {
            // @ts-ignore
            res.status(500).json({ message: error.message });
        }
    }
}
