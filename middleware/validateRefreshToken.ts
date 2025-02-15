import {NextFunction, Request, Response} from "express";
import TokenService from "../service/token-service";

// Middleware для валидации refresh token
export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Получаем токен из заголовка
        if (!token) {
            return res.status(401).json({ message: "Нет refresh token" });
        }

        req.body.user = await TokenService.validateRefreshToken(token);  // Сохраняем данные пользователя в body
        console.log(req.body.user);
        next();
    } catch (error) {
        return res.status(403).json({ message: "Неверный refresh token" });
    }
};
