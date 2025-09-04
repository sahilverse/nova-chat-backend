import * as z from "zod";



// loginSchema is used for validating user login input
export const loginSchema = z.object({
    email: z.email().min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});



//  registerSchema is used for validating user registration input
export const registerSchema = loginSchema.extend({
    name: z.string().min(1, "Name is required"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
