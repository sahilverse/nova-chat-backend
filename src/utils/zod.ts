import * as z from "zod";


// loginSchema is used for validating user login input
export const loginSchema = z.object({
    email: z.email().min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});



//  registerSchema is used for validating user registration input
export const registerSchema = loginSchema.extend({
    name: z.string().min(1, "Name is required"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
})

