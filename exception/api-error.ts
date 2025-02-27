const errorApi = class ApiError extends Error{
    status
    errors
    constructor(status: number, message: string | undefined, errors: any = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
    static UnauthorizedError() {
        return new ApiError(401, "Пользователь не авторизован")
    }
    static BadRequest(message: string | undefined, errors = []) {
        return new ApiError(400, message, errors)
    }
}
export default errorApi