import { z } from "zod";

/** 24-character hex MongoDB ObjectId. */
export const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "Must be a valid record ID");

/** Trims strings and treats empty values as not provided. */
export const optionalTrimmedText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));
