import { expect, test, describe } from "bun:test";
import { estimateTokens, validateTokenLimit } from "../src/utils/token.js";

describe("Token Estimator", () => {
  test("estimateTokens should follow 4-char heuristic", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("")).toBe(0);
  });

  test("validateTokenLimit should return false for massive text", () => {
    const longText = "a".repeat(40000);
    expect(validateTokenLimit(longText, 5000)).toBe(false);
  });

  test("validateTokenLimit should return true for short text", () => {
    expect(validateTokenLimit("short", 5000)).toBe(true);
  });
});
