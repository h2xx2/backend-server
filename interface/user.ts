export default interface IUser {
    id: string;
    email: string;
    password: string;
    is_activated: boolean;
    activation_link: string;
    created_at?: string;  // Автоматически добавляется Supabase
}