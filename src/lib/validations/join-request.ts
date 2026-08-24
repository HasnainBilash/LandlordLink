import { z } from "zod";

export const createJoinRequestSchema = z.object({
  accessCode: z
    .string()
    .trim()
    .min(1, "Building access code is required.")
    .max(20, "Building access code is too long."),

  message: z
    .string()
    .trim()
    .max(500, "Message is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateJoinRequestInput = z.infer<typeof createJoinRequestSchema>;