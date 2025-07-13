export interface JwtTokenPayload {
    id: string;
    email: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}