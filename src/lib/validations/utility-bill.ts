import { z } from "zod";

export const utilityTypeValues = [
  "ELECTRICITY",
  "GAS",
  "WATER",
  "INTERNET",
  "SECURITY",
  "OTHER",
] as const;

export const createUtilityBillSchema = z
  .object({
    type: z.enum(utilityTypeValues),

    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Select a billing month."),

    amount: z.coerce
      .number()
      .min(0.01, "Amount must be greater than zero.")
      .max(9999999.99, "Amount is too high."),

    dueDate: z.coerce.date(),
  })
  .transform(({ period, ...rest }) => {
    const [year, month] = period.split("-").map(Number);

    return { ...rest, month, year };
  });

export type CreateUtilityBillInput = z.infer<typeof createUtilityBillSchema>;
