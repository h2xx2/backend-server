export interface Review {
    id?: string;
    created_at?: string;
    user_id: string;
    title: string;
    description: string;
}

export interface MediaFile {
    id?: string;
    review_id: string;
    s3_key: string;
    file_type: string;
    uploaded_at?: string;
}