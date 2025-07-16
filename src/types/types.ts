export interface JwtTokenPayload {
    id: string;
    email: string;
    name: string;
    profileImage?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}