import { logger } from "./logger.js";

/**
 * Token Safety Estimator.
 * Heuristic: 1 token is roughly 4 characters in English code.
 * This helps users avoid exhausting their 10,000 free neuron daily limit.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Warn the user if the file is excessively large.
 */
export function validateTokenLimit(text: string, limit: number = 7500): boolean {
  const estimation = estimateTokens(text);
  if (estimation > limit) {
    logger.warn(`Heuristic Alert: This file is estimated at ${estimation} tokens.`);
    logger.dim(`Submitting this to AI might consume ~${estimation} neurons of your 10,000 daily limit.`);
    return false;
  }
  return true;
}
