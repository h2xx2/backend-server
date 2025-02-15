import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'
import cookieParser from "cookie-parser";
import router from "./router/index";
import errorMiddleware from "./middleware/error-middleware"
import multer from "multer";
import {supabase} from "./supabase";
import {ReviewService} from "./service/review-service"

const app = express();

const storage = multer.memoryStorage(); // Если загружаете в Supabase, используйте memoryStorage
const upload = multer({ storage });
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.delete('/api/reviews/:id', async (req, res):Promise<any> => {
    const reviewId = req.params.id;

    try {
        // Получаем все медиафайлы, связанные с отзывом
        const { data: mediaFiles, error: mediaError } = await supabase
            .from('media_files')
            .select('id, url')
            .eq('review_id', reviewId); // Предположим, что у вас есть поле review_id в таблице media_files


        // Если медиафайлы не найдены, просто пропускаем удаление
        if (mediaFiles && mediaFiles.length > 0) {
            console.log("Медиафайлы для удаления:", mediaFiles);

            // Удаляем файлы из Supabase Storage
            const deletePromises = mediaFiles.map(async (file) => {
                const { error: storageError } = await supabase.storage
                    .from('review')  // Замените на название вашего бакета
                    .remove([file.url]);  // Удаляем файл по URL

                if (storageError) {
                    console.error(`Ошибка при удалении файла ${file.url}:`, storageError);
                    return storageError;
                }

                console.log(`Файл ${file.url} успешно удален`);
            });

            // Ожидаем, пока все файлы будут удалены
            await Promise.all(deletePromises);
        } else {
            console.log("Медиафайлы не найдены, пропускаем удаление файлов.");
        }

        // Удаляем запись отзыва из базы данных
        const { error: deleteError } = await supabase
            .from('review')
            .delete()
            .eq('id', reviewId);

        if (deleteError) {
            console.error("Ошибка при удалении отзыва:", deleteError);
            return res.status(500).json({ message: "Ошибка удаления отзыва", error: deleteError });
        }

        console.log(`Отзыв с ID ${reviewId} успешно удален`);

        return res.status(200).json({ message: "Отзыв и связанные файлы успешно удалены" });

    } catch (err) {
        console.error("Ошибка при удалении отзыва и файлов:", err);
        return res.status(500).json({ message: "Ошибка при удалении отзыва и файлов", error: err });
    }
});

app.get('/api/reviews/:id', async (req, res):Promise<any> => {
    try {
        const reviewId = req.params.id;
        const review = await ReviewService.getReview(reviewId); // функция для получения отзыва из базы данных

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Отправляем только данные отзыва без лишней информации
        return res.json(review);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);

// @ts-ignore
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});