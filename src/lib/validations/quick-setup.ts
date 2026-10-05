import { z } from "zod";

import { manualFlatStatusValues } from "@/lib/validations/flat";

export const quickSetupSchema = z
  .object({
    fromFloor: z.coerce
      .number()
      .int("From floor must be a whole number.")
      .min(-5, "Floor number is too low.")
      .max(200, "Floor number is too high."),

    toFloor: z.coerce
      .number()
      .int("To floor must be a whole number.")
      .min(-5, "Floor number is too low.")
      .max(200, "Floor number is too high."),

    flatsPerFloor: z.coerce
      .number()
      .int("Flats per floor must be a whole number.")
      .min(1, "Each floor needs at least 1 flat.")
      .max(50, "Flats per floor is too high."),

    bedrooms: z.coerce
      .number()
      .int("Bedrooms must be a whole number.")
      .min(0, "Bedrooms cannot be negative.")
      .max(50, "Bedrooms is too high."),

    bathrooms: z.coerce
      .number()
      .int("Bathrooms must be a whole number.")
      .min(0, "Bathrooms cannot be negative.")
      .max(50, "Bathrooms is too high."),

    monthlyRent: z.coerce
      .number()
      .min(0, "Monthly rent cannot be negative.")
      .max(9999999.99, "Monthly rent is too high."),

    status: z.enum(manualFlatStatusValues).default("VACANT"),
  })
  .refine((data) => data.toFloor >= data.fromFloor, {
    message:
      "The ending floor must be greater than or equal to the starting floor.",
    path: ["toFloor"],
  });

export type QuickSetupInput = z.infer<typeof quickSetupSchema>;