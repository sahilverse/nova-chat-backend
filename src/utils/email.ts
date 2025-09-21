import nodemailer from 'nodemailer';
import { EMAIL_PASS, EMAIL_USER } from '../constants';


interface MailOptions {
    to: string;
    subject: string;
    html: string;
}


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});


export const sendEmail = async ({ to, subject, html }: MailOptions): Promise<void> => {
    const mailOptions = {
        from: EMAIL_USER,
        to,
        subject,
        html
    };

    try {

        await transporter.sendMail(mailOptions);

    } catch (error) {

        throw new Error(`Failed to send email: ${error}`);

    }
}