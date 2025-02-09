declare global {
    namespace Express {
        interface Response {
            locals: {
                userId?: string; // Ваше кастомное свойство
            };
        }
    }
}
export {}; // Обязательный экспорт