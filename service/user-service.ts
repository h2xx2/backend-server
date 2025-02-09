import bcrypt from "bcrypt";
import {v4 as uuidv4} from 'uuid';
import {supabase} from "../supabase";
import mailService from "./mail-service";
import tokenService from "./token-service";
import userDTO from '../dtos/user-dto';
import ApiError from "../exception/api-error";


class UserService {
    async registration(email: string, password: string) {
        // Проверка существующего пользователя
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) throw ApiError.BadRequest(`Пользователь с email ${email} уже существует`);

        // Создание пользователя
        const hashedPassword = await bcrypt.hash(password, 10);
        const activationLink = uuidv4();

        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                email,
                password: hashedPassword,
                activation_link: activationLink
            }])
            .select()
            .single();

        if (createError) throw ApiError.BadRequest(createError.message);

        // Отправка письма активации
        await mailService.sendActivationEmail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        // Генерация токенов
        const userDto = new userDTO(newUser);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(newUser.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async activate(activationLink: string) {
        const { data: user, error } = await supabase
            .from('users')
            .update({ is_activated: true })
            .eq('activation_link', activationLink)
            .select()
            .single();

        if (error || !user) throw ApiError.BadRequest('Некорректная ссылка активации');
        return user;
    }
    async  login(email:string , password:string) {
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (!user){
            throw ApiError.BadRequest('Пользователь с таким email не найден')
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if(!isPassEqual){
            throw ApiError.BadRequest('Неверный пароль')
        }
        const userDto = new userDTO(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto };
    }
    async logout(refreshtoken:any){
        return await tokenService.removeToken(refreshtoken);
    }
    async refresh(refreshtoken:any){
        if(!refreshtoken){
            throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshtoken);
        const tokenFromDatabase = tokenService.findToken(refreshtoken);

        if(!userData || !tokenFromDatabase) {
            throw ApiError.UnauthorizedError()
        }
        const iduser = await supabase
            .from('token')
            .select('user_id')
            .eq("refresh_token", refreshtoken);
        const {data: user} = await supabase
            .from('users')
            .select('*')
            .eq("id", iduser);

        // @ts-ignore
        const userDto = new userDTO(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto };
    }
}

export default new UserService();