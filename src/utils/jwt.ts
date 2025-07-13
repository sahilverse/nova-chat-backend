import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Redis from "../config/redisClient";
import { JwtTokenPayload } from '../types/types';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION_DAYS, JWT_ACCESS_EXPIRATION_MINUTES } from '../constants';

class JwtUtils {
    private static readonly accessSecret = JWT_ACCESS_SECRET;
    private static readonly refreshSecret = JWT_REFRESH_SECRET;
    private static readonly accessExpiration: number = JWT_ACCESS_EXPIRATION_MINUTES || 15;
    private static readonly refreshExpiration: number = JWT_REFRESH_EXPIRATION_DAYS || 1;



    private static buildPayload(user: User): JwtTokenPayload {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }

    public static generateAccessToken(user: User): string {
        return jwt.sign(this.buildPayload(user), this.accessSecret, {
            expiresIn: `${this.accessExpiration}m`,
        });
    }

    public static async generateRefreshToken(user: User): Promise<{ token: string; jti: string }> {
        const jti = uuidv4();
        const token = jwt.sign(
            {
                ...this.buildPayload(user),
                jti,
            },
            this.refreshSecret,
            {
                expiresIn: `${this.refreshExpiration}d`,
            }
        );

        await Redis.set(`refresh_jti:${jti}`, 'valid', {
            EX: this.refreshExpiration * 24 * 60 * 60,
        });

        return { token, jti };
    }

    public static verifyAccessToken(token: string): JwtPayload {
        return this.verifyToken(token, this.accessSecret, 'access');
    }

    public static async verifyRefreshToken(token: string): Promise<JwtPayload> {

        const payload = this.verifyToken(token, this.refreshSecret, 'refresh');

        const jti = payload.jti;
        if (!jti) throw new Error('Refresh token missing jti');

        const isValid = await Redis.get(`refresh_jti:${jti}`);


        if (!isValid) throw new Error('Refresh token has been revoked');

        return payload;
    }

    public static async revokeRefreshToken(token: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, this.refreshSecret) as JwtPayload;
            const jti = decoded.jti;
            if (jti) await Redis.del(`refresh_jti:${jti}`);
        } catch (err) {
            console.error('Error revoking refresh token:', err);
        }
    }

    private static verifyToken(token: string, secret: string, type: 'access' | 'refresh'): JwtPayload {
        try {
            const decoded = jwt.verify(token, secret);
            if (typeof decoded === 'string') throw new Error(`${type} token payload is not an object`);
            return decoded;
        } catch (err: any) {
            throw new Error(`Invalid ${type} token: ${err.message}`);
        }
    }
}

export default JwtUtils;
