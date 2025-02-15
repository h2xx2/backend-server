import jwt from "jsonwebtoken";
import {supabase} from "../supabase";

class TokenService {
    generateTokens(payload: object) {
            const safePayload = JSON.parse(JSON.stringify(payload, (_, value) => {
                // Удаляем циклические ссылки
                if (typeof value === 'object' && value !== null) {
                    return Object.fromEntries(
                        Object.entries(value).filter(([key]) => !key.startsWith('_'))
                    );
                }
                return value;
            }));

        return {
            accessToken: jwt.sign(safePayload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '30m' }),
            refreshToken: jwt.sign(safePayload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' })
        };
    }

    validateAccessToken(token:string) {
        try{
            const userData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
            return userData;
        }
        catch(error){
            return null
        }
    }

    async validateRefreshToken(token: string) {
        try {
            console.log(token)
            return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (error) {
            console.log(error);
            return null;
        }
    }


    async saveToken(userId: string, refreshToken: string) {
        const { data, error } = await supabase
            .from('token')
            .upsert({ user_id: userId, refresh_token: refreshToken });

        if (error) throw new Error(error.message);
        return data;
    }

    async removeToken(refreshToken:string) {
        const { error } = await supabase
            .from('token')
            .delete()
            .eq('refresh_token', refreshToken);

        if (error) throw new Error(error.message);
        return true;
    }

    async findToken(refreshToken:string) {
        // @ts-ignore
        const { error } =  supabase
            .from('token')
            .select()
            .eq('refresh_token', refreshToken)
            .single;

        if (error) throw new Error(error.message);
        return true;
    }
}

export default new TokenService();