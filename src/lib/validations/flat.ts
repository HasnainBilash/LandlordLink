import { z } from "zod";

export const flatStatusValues = ["VACANT", "OCCUPIED", "MAINTENANCE"] as const;

// OCCUPIED is never set by hand — it follows from an active lease
// (approving a request sets it, ending the lease clears it).
export const manualFlatStatusValues = ["VACANT", "MAINTENANCE"] as const;

export const createFlatSchema = z.object({
  flatNumber: z
    .string()
    .trim()
    .min(1, "Flat number is required.")
    .max(20, "Flat number is too long.")
    // "~" marks deleted flats (see lib/tombstone.ts).
    .refine((value) => !value.includes("~"), "Flat number can't contain ~."),

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
});

export type CreateFlatInput = z.infer<typeof createFlatSchema>;

export const createFlatsBulkSchema = z
  .object({
    fromFlatNumber: z.coerce
      .number()
      .int("From flat number must be a whole number.")
      .min(0, "Flat number cannot be negative.")
      .max(99999, "Flat number is too high."),

    toFlatNumber: z.coerce
      .number()
      .int("To flat number must be a whole number.")
      .min(0, "Flat number cannot be negative.")
      .max(99999, "Flat number is too high."),

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
  .refine((data) => data.toFlatNumber >= data.fromFlatNumber, {
    message:
      "The ending flat number must be greater than or equal to the starting flat number.",
    path: ["toFlatNumber"],
  });

export type CreateFlatsBulkInput = z.infer<typeof createFlatsBulkSchema>;