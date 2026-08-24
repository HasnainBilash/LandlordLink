import { z } from "zod";

export const approveJoinRequestSchema = z.object({
  startDate: z.coerce.date(),

  monthlyRent: z.coerce
    .number()
    .min(0.01, "Monthly rent must be greater than zero.")
    .max(9999999.99, "Monthly rent is too high."),

  deposit: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Deposit must be a valid non-negative number."
    ),
});

export type ApproveJoinRequestInput = z.infer<typeof approveJoinRequestSchema>;
