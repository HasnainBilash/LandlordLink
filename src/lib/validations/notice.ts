import { z } from "zod";

export const noticeAudienceValues = ["ALL", "TENANTS", "LANDLORDS"] as const;

export const createNoticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters.")
    .max(200, "Title is too long."),

  content: z
    .string()
    .trim()
    .min(1, "Content is required.")
    .max(2000, "Content is too long."),

  audience: z.enum(noticeAudienceValues).default("ALL"),

  expiresAt: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  ),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
