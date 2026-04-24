import { z } from "zod";

/**
 * Enterprise Schema for AI Code Review Output.
 * Ensures the AI returns structured, actionable data.
 */
export const ReviewSchema = z.object({
  reviews: z.array(
    z.object({
      line: z.number().optional(),
      severity: z.enum(["Critical", "High", "Medium", "Low"]),
      finding: z.string(),
      impact: z.string(),
      recommendation: z.string(),
    }),
  ),
});

export type CodeReview = z.infer<typeof ReviewSchema>;
