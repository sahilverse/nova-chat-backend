
export const PORT = Number(process.env.PORT!);


export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;


export const JWT_ACCESS_EXPIRATION_MINUTES = Number(process.env.JWT_ACCESS_EXPIRATION_MINUTES);
export const JWT_REFRESH_EXPIRATION_DAYS = Number(process.env.JWT_REFRESH_EXPIRATION_DAYS);

export const CLIENT_URL = process.env.CLIENT_URL!;
export const REDIS_URL = process.env.REDIS_URL!;