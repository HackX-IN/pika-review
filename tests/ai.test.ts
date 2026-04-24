import { expect, test, describe } from "bun:test";
import { extractJSON } from "../src/core/ai.js";

describe("AI JSON Extractor", () => {
  test("should extract JSON from markdown blocks", () => {
    const raw = "Here is the result: ```json\n{\"reviews\": []}\n``` Hope it helps!";
    expect(JSON.parse(extractJSON(raw))).toEqual({ reviews: [] });
  });

  test("should handle truncated JSON by auto-closing brackets", () => {
    const raw = '{"reviews": [{"finding": "bug"';
    const extracted = extractJSON(raw);
    expect(extracted).toContain(']}');
    expect(() => JSON.parse(extracted)).not.toThrow();
  });

  test("should repair missing commas between objects", () => {
    const raw = '{"reviews": [{"a": 1} {"b": 2}]}';
    const extracted = extractJSON(raw);
    expect(extracted).toContain('{"a": 1},{"b": 2}');
    expect(JSON.parse(extracted).reviews).toHaveLength(2);
  });

  test("should sanitize control characters", () => {
    const raw = '{"finding": "line\u0001break"}';
    const extracted = extractJSON(raw);
    expect(() => JSON.parse(extracted)).not.toThrow();
  });
  
  test("should handle raw arrays by wrapping them", () => {
    const raw = '[{"finding": "bug"}]';
    const extracted = extractJSON(raw);
    expect(JSON.parse(extracted)).toHaveProperty("reviews");
  });
});
