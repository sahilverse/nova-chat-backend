import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from "../config";
import {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRATION_DAYS,
    JWT_ACCESS_EXPIRATION_MINUTES,
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    JWT_RESET_PASSWORD_SECRET
} from '../constants';

class JwtUtils {
    private static readonly accessSecret = JWT_ACCESS_SECRET;
    private static readonly refreshSecret = JWT_REFRESH_SECRET;
    private static readonly accessExpiration: number = JWT_ACCESS_EXPIRATION_MINUTES || 15;
    private static readonly refreshExpiration: number = JWT_REFRESH_EXPIRATION_DAYS || 1;
    private static readonly resetPasswordSecret = JWT_RESET_PASSWORD_SECRET;
    private static readonly resetPasswordExpiration: number = JWT_RESET_PASSWORD_EXPIRATION_MINUTES || 15;


    public static generateAccessToken(id: string): string {
        return jwt.sign({ id }, this.accessSecret, {
            expiresIn: `${this.accessExpiration}m`,
        });
    }

    public static async generateRefreshToken(id: string): Promise<{ token: string; jti: string }> {
        const jti = uuidv4();
        const token = jwt.sign(
            {
                id,
                jti,
            },
            this.refreshSecret,
            {
                expiresIn: `${this.refreshExpiration}d`,
            }
        );

        await redisClient.set(`refresh_jti:${jti}`, 'valid', {
            EX: this.refreshExpiration * 24 * 60 * 60,
        });

        return { token, jti };
    }

    public static verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(token, this.accessSecret) as JwtPayload;
    }

    public static async verifyRefreshToken(token: string): Promise<JwtPayload> {

        const payload = jwt.verify(token, this.refreshSecret) as JwtPayload;

        const jti = payload.jti;
        if (!jti) throw new Error('Refresh token missing jti');

        const isValid = await redisClient.get(`refresh_jti:${jti}`);


        if (!isValid) throw new Error('Refresh token has been revoked');

        return payload;
    }

    public static async revokeRefreshToken(token: string): Promise<void> {
        const decoded = jwt.verify(token, this.refreshSecret) as JwtPayload;
        const jti = decoded.jti;
        if (jti) await redisClient.del(`refresh_jti:${jti}`);
    }

    public static generateResetPasswordSessionToken(email: string): string {
        const token = jwt.sign({ email, purpose: 'reset_password_session' }, this.accessSecret, {
            expiresIn: '15m',
        });
        return token;
    }

    public static async verifyResetPasswordSessionToken(token: string): Promise<string> {
        const decoded = jwt.verify(token, this.accessSecret) as JwtPayload;
        if (decoded.purpose !== 'reset_password_session') throw new Error('Invalid token purpose');
        return decoded.email;
    }

    public static generatePasswordResetToken(payload: { email: string, otp: string }): string {

        const token = jwt.sign(
            { ...payload, type: 'password_reset' },
            this.resetPasswordSecret,
            { expiresIn: `${this.resetPasswordExpiration}m` }
        );

        return token;
    }

    public static verifyPasswordResetToken(token: string): { email: string, otp: string, type: string } {
        const decoded = jwt.verify(token, this.resetPasswordSecret);
        if (typeof decoded === 'string') throw new Error('Invalid token');
        return decoded as { email: string, otp: string, type: string };
    }
}

export default JwtUtils;
