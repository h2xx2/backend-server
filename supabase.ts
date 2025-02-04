// supabaseClient.ts
import { createClient } from '@supabase/supabase-js/dist/main';

// Проверка переменных окружения
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error(`
    Supabase credentials not found! 
    Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file
  `);
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);