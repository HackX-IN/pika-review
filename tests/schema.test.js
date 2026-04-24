import { expect, test, describe } from "bun:test";
import { ReviewSchema } from "../src/utils/schema.js";
describe("Schema Validation", () => {
    test("should validate correct review objects", () => {
        const valid = {
            reviews: [
                {
                    line: 1,
                    severity: "High",
                    finding: "Found something",
                    impact: "Big impact",
                    recommendation: "Fix it"
                }
            ]
        };
        expect(() => ReviewSchema.parse(valid)).not.toThrow();
    });
    test("should reject invalid severities", () => {
        const invalid = {
            reviews: [
                {
                    line: 1,
                    severity: "SuperCritical", // Not in enum
                    finding: "x",
                    impact: "y",
                    recommendation: "z"
                }
            ]
        };
        expect(() => ReviewSchema.parse(invalid)).toThrow();
    });
    test("should handle empty reviews array", () => {
        expect(() => ReviewSchema.parse({ reviews: [] })).not.toThrow();
    });
});
