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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);

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

app.post('/api/delete-image', async (req, res): Promise<any> => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: "Отсутствует URL изображения" });
        }

        const pathParts = url.split('/review/');
        if (pathParts.length < 2) {
            return res.status(400).json({ message: "Некорректный URL изображения" });
        }

        const path = `${pathParts[1]}`;
        const { error: storageError } = await supabase.storage
            .from('review')
            .remove([path]);

        if (storageError) {
            console.error("Ошибка при удалении изображения:", storageError);
            return res.status(500).json({ message: "Ошибка при удалении изображения" });
        }

        console.log(`Изображение ${path} успешно удалено`);
        return res.status(200).json({ message: "Изображение успешно удалено" });

    } catch (err) {
        console.error("Ошибка при удалении изображения:", err);
        return res.status(500).json({ message: "Ошибка при удалении изображения", error: err });
    }
});


app.put('/api/reviews/:id', upload.array('files'), async (req, res): Promise<any> => {
    const reviewId = req.params.id;
    const { title, description } = req.body;
    let existingFiles = req.body.existing_files || []; // Существующие файлы, которые не должны удаляться
    const files = req.files as Express.Multer.File[];

    // Преобразуем existingFiles в массив, если он не является массивом
    if (!Array.isArray(existingFiles)) {
        existingFiles = [existingFiles]; // Если это строка, то создаём массив
    }

    try {
        // Обновляем данные отзыва
        const { error: updateError } = await supabase
            .from('review')
            .update({ title, description })
            .eq('id', reviewId);

        if (updateError) {
            console.error("Ошибка при обновлении отзыва:", updateError);
            return res.status(500).json({ message: "Ошибка при обновлении отзыва" });
        }

        const newUrls: string[] = [];
        const newFilePaths: string[] = [];

        // Загружаем новые файлы в Supabase Storage
        if (files.length > 0) {
            for (const file of files) {
                const fileName = `${Date.now()}-${file.originalname}`;
                const filePath = `review/${reviewId}/${fileName}`; // Путь сохраняем корректно

                const { data, error: uploadError } = await supabase.storage
                    .from('review')
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype
                    });

                if (uploadError) {
                    console.error("Ошибка при загрузке файла:", uploadError);
                    continue;
                }

                // Генерация публичного URL на основе правильного пути
                const publicUrl = supabase.storage
                    .from('review')
                    .getPublicUrl(data.path)
                    .data.publicUrl;

                newUrls.push(publicUrl);
                newFilePaths.push(filePath); // Добавляем только правильный путь

                // Сохраняем путь к файлу и тип файла в таблице media_files
                const { error: insertError } = await supabase
                    .from('media_files')
                    .insert([
                        {
                            review_id: reviewId,
                            storage_path: filePath,  // Сохраняем путь без дублирования
                            file_type: file.mimetype  // Добавляем тип файла
                        }
                    ]);

                if (insertError) {
                    console.error("Ошибка при сохранении URL в media_files:", insertError);
                } else {
                    console.log(`URL изображения сохранён: ${publicUrl}`);
                }
            }
        }

        // Смотрим на текущие файлы в базе данных
        const { data: oldFiles } = await supabase
            .from('media_files')
            .select('id, storage_path') // Используем storage_path, а не url
            .eq('review_id', reviewId);

        const oldUrls = oldFiles?.map(file => file.storage_path) || [];

        // Старые файлы, которые не были изменены и не удалены вручную, не должны удаляться
        const filesToDelete = oldUrls.filter(url => !existingFiles.includes(url) && !newFilePaths.includes(url)); // Не включаем новые и существующие файлы

        // Логируем старые файлы для удаления
        console.log("Старые файлы для удаления:", filesToDelete);

        // Удаляем старые файлы, которые не в списке существующих и новых
        if (filesToDelete.length > 0) {
            // Удаляем старые файлы из базы данных
            await supabase
                .from('media_files')
                .delete()
                .in('storage_path', filesToDelete);  // Здесь тоже используем storage_path

            const deletePromises = filesToDelete.map(async (url) => {
                const pathParts = url.split('/review/');
                const path = `review/${pathParts[1]}`;

                const { error: storageError } = await supabase.storage
                    .from('review')
                    .remove([path]);

                if (storageError) {
                    console.error("Ошибка при удалении файла:", storageError);
                }
            });

            await Promise.all(deletePromises);
        }

        console.log("Отзыв успешно обновлен");
        return res.status(200).json({ message: "Отзыв успешно обновлен", newUrls });

    } catch (err) {
        console.error("Ошибка при обновлении отзыва:", err);
        return res.status(500).json({ message: "Ошибка при обновлении отзыва", error: err });
    }
});










// @ts-ignore
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});