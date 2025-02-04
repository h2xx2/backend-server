import nodemailer from "nodemailer"

class MailService {
    private transporter: nodemailer.Transporter;
    constructor(){
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        })
    }


    async sendActivationEmail(to:string, link: string) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            text: '',
            subject: 'Активация аккаунта на ' + process.env.API_URL,
            html: `
                <div> 
                    <h1>Для активации перейдите по ссылке</h1>
                    <a href="${link}">${link}</a>
                </div>
            `
        })
    }
}
export default new MailService()