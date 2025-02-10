// declare global {
//     namespace Express {
//         interface Response {
//             locals: {
//                 userId?: string; // Ваше кастомное свойство
//             };
//         }
//     }
// }
// export {}; // Обязательный экспорт
declare namespace Express {
    export interface Request {
        files?: Express.Multer.File[]; // Для поддержки req.files от multer
    }
}