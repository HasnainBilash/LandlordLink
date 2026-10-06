import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters.").max(100, "Name is too long."),
    // Stored in lowercase, so "Farhan@…" and "farhan@…" are one account.
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long."),
    confirmPassword: z.string().min(8).max(128),
    role: z.enum(["LANDLORD", "TENANT"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;