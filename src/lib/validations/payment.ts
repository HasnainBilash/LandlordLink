import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.01, "Payment amount must be greater than zero.")
    .max(9999999.99, "Payment amount is too high."),

  transactionRef: z
    .string()
    .trim()
    .max(100, "Transaction reference is too long.")
    .optional()
    .or(z.literal("")),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
