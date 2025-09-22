import * as z from "zod";


// loginSchema 
export const loginSchema = z.object({
    email: z
        .email()
        .min(1, "Email is required")
        .transform((val) => val.trim().toLowerCase()),
    password: z.string().min(1, "Password is required"),
});

// registerSchema 
export const registerSchema = loginSchema.extend({
    name: z.string().min(1, "Name is required").transform((val) => val.trim()),
    confirmPassword: z
        .string()
        .min(6, "Confirm Password must be at least 6 characters"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).*$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


// changePasswordSchema
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current Password is required"),
    newPassword: z
        .string()
        .min(6, "New Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).*$/,
            "New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    confirmNewPassword: z
        .string()
        .min(6, "Confirm New Password must be at least 6 characters"),
}).refine((data) => data.newPassword !== data.currentPassword, {
    message: "New Password must be different from Current Password",
    path: ["newPassword"],
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New Passwords do not match",
    path: ["confirmNewPassword"],
});


// verify OTP schema
export const verifyOTPSchema = z.object({
    email: z
        .email()
        .min(1, "Email is required")
        .transform((val) => val.trim().toLowerCase()),
    token: z.string().min(6, "OTP must be 6 characters"),
});


// resetPasswordSchema
export const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(6, "New Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).*$/,
            "New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    confirmNewPassword: z
        .string()
        .min(6, "Confirm New Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
})



// updateProfileSchema
export const profileImageSchema = z
    .object({
        originalname: z.string(),
        mimetype: z.enum(["image/jpeg", "image/png", "image/webp"]),
        size: z.number().max(4 * 1024 * 1024, "File size must be less than 4MB"),
    })
    .loose();

