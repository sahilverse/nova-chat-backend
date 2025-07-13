import bcrypt from 'bcryptjs';

class BcryptUtils {
    private static readonly saltRounds = 10;

    public static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.saltRounds);
    }

    public static async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}

export default BcryptUtils;
