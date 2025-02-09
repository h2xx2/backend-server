import {supabase} from "../supabase";
import { Review, MediaFile } from "../interface/review";

export class ReviewService {
    static async createReview(review: Review, mediaFiles: MediaFile[]) {
        const { data: reviewData, error: reviewError } = await supabase
            .from("review")
            .insert([{ user_id: review.user_id, title: review.title, description: review.description }])
            .select("id")
            .single();

        if (reviewError) throw new Error(reviewError.message);

        if (mediaFiles && mediaFiles.length > 0) {
            const mediaEntries = mediaFiles.map((file) => ({
                review_id: reviewData.id,
                s3_key: file.s3_key,
                file_type: file.file_type,
            }));

            const { error: mediaError } = await supabase.from("media_files").insert(mediaEntries);
            if (mediaError) throw new Error(mediaError.message);
        }

        return reviewData;
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
                media_files (id, s3_key, file_type, uploaded_at)
            `);

        if (reviewsError) throw new Error(reviewsError.message);

        return reviews;
    }
}
