import { Request, Response, NextFunction } from "express";
import tokenService from "../service/token-service";

export const verifyRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token отсутствует" });
            return;
        }

        const userDTO = tokenService.validateRefreshToken(refreshToken);
        if (!userDTO) {
            res.status(401).json({ message: "Неверный refresh token" });
            return;
        }

        // Сохраняем в res.locals
        res.locals.userId = userDTO;

        next();
    } catch (error) {
        res.status(401).json({ message: "Ошибка проверки refresh token" });
    }
};