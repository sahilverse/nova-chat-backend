export const PORT = process.env.PORT || 3000;
export const JWT_ACCESS_EXPIRATION_MINUTES = parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || "15");
export const JWT_REFRESH_EXPIRATION_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || "1");