export default class UserDTO {
    public id: string;
    public email: string;
    public isActivated: boolean;

    constructor(user: {
        id: string;
        email: string;
        is_activated: boolean;
    }) {
        this.id = user.id;
        this.email = user.email;
        this.isActivated = user.is_activated;
    }
}