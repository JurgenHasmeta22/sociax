import { z } from "zod";

export const registerSchema = z
    .object({
        email: z.string().email("Please enter a valid email."),
        userName: z
            .string()
            .min(3, "Username must be at least 3 characters.")
            .max(30, "Username must be at most 30 characters.")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores.",
            ),
        password: z.string().min(6, "Password must be at least 6 characters."),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    emailOrUsername: z.string().min(1, "Please enter your email or username."),
    password: z.string().min(1, "Please enter your password."),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
