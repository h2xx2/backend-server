import { supabase } from "../supabase";
import { Review, MediaFile } from "../interface/review";

export class ReviewService {
    static async createReview(review: Review, mediaFiles: any[]) {
        try {
            // Создаем запись отзыва
            console.log("Создаем отзыв:", review);
            const { data: reviewData, error: reviewError } = await supabase
                .from("review")
                .insert([{ user_id: review.user_id, title: review.title, description: review.description }])
                .select("id")
                .single();

            if (reviewError) {
                throw new Error(`Ошибка при создании отзыва: ${reviewError.message}`);
            }

            // Загрузка файлов в Storage и создание записей в media_files
            if (mediaFiles && mediaFiles.length > 0) {
                const mediaEntries = [];

                for (const file of mediaFiles) {
                    const fileName = `${reviewData.id}_${Date.now()}_${file.originalname}`; // Генерация безопасного имени файла
                    const { data: fileData, error: uploadError } = await supabase.storage
                        .from("review")
                        .upload(`review/${reviewData.id}/${fileName}`, file.buffer, {
                            contentType: file.mimetype,
                        });

                    if (uploadError) {
                        throw new Error(`Ошибка при загрузке файла ${fileName}: ${uploadError.message}`);
                    }

                    // Добавляем данные о файле в media_files
                    mediaEntries.push({
                        review_id: reviewData.id,
                        file_type: file.mimetype,
                        storage_path: fileData?.path, // Путь в Supabase Storage
                    });
                }

                // Вставка данных о медиафайлах в таблицу media_files
                const { error: mediaError } = await supabase
                    .from("media_files")
                    .insert(mediaEntries)
                    .select();

                if (mediaError) {
                    console.error("Ошибка при вставке в media_files:", mediaError);
                }
            }

            // Возвращаем данные отзыва
            return reviewData;
        } catch (error) {
            console.error("Ошибка при создании отзыва:", error);
        }
    }

    static async getReviews() {
        const { data: reviews, error: reviewsError } = await supabase
            .from("review")
            .select(`
                    id, 
                    created_at, 
                    user_id, 
                    title, 
                    description,
                    media_files (id, storage_path, file_type, uploaded_at),
                    users (email) 
                `);


        if (reviewsError) throw new Error(reviewsError.message);

        // Добавляем ссылки для фотографий
        for (const review of reviews) {
            if (review.media_files && review.media_files.length > 0) {
                review.media_files = review.media_files.map((file) => {
                    // Генерация публичного URL (замените на createSignedUrl для приватных файлов)
                    const { data: publicUrl } = supabase.storage
                        .from("review") // Укажите имя вашего bucket
                        .getPublicUrl(file.storage_path);

                    return {
                        ...file,
                        url: publicUrl?.publicUrl, // Добавляем ссылку на файл
                    };
                });
            }
        }

        return reviews;
    }
    static async getMyReviews(userId: string):Promise<any> {
        const {data: reviews, error: reviewsError} = await supabase
            .from("review")
            .select(`
                    id, 
                    created_at, 
                    user_id, 
                    title, 
                    description,
                    media_files (id, storage_path, file_type, uploaded_at),
                    users (email) 
                `)
            .eq('user_id', userId);


        if (reviewsError) throw new Error(reviewsError.message);

        // Добавляем ссылки для фотографий
        for (const review of reviews) {
            if (review.media_files && review.media_files.length > 0) {
                review.media_files = review.media_files.map((file) => {
                    // Генерация публичного URL (замените на createSignedUrl для приватных файлов)
                    const {data: publicUrl} = supabase.storage
                        .from("review") // Укажите имя вашего bucket
                        .getPublicUrl(file.storage_path);

                    return {
                        ...file,
                        url: publicUrl?.publicUrl, // Добавляем ссылку на файл
                    };
                });
            }
        }
        return reviews;
    }
}
