import { Request, Response, NextFunction } from 'express';
import userService from "../service/user-service";
import {validationResult} from "express-validator";
import ApiError from "../exception/api-error";


class UserController {
    // Изменили сигнатуру метода registration для использования Express‑объектов
    async registration(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const error:any = validationResult(req);
            if(!error.isEmpty()) {
                // @ts-ignore
                return next(ApiError.BadRequest('Не корректные данные', error.array()));
            }

            // Извлекаем данные из тела запроса
            const { email, password } = req.body;
            const userData = await  userService.registration(email, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly:true});
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {email, password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, secure: false, sameSite: "lax", httpOnly:false});
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {console.log("Куки в запросе:", req.cookies);
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json({token});
        } catch (e) {
            next(e);
        }
    }



    async activate(req: Request<{ link: string }>, res: Response, next: NextFunction): Promise<void> {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL!);
        } catch (e) {
            next(e);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {refreshToken} = req.cookies;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly:true});
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }
}

export default new UserController();
