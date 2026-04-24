import { expect, test, describe } from "bun:test";
import { setupReportDir, writeMarkdownReport } from "../src/core/reporter.js";
import fs from "fs";
import path from "path";

describe("Reporter Utility", () => {
  test("setupReportDir should create a directory", () => {
    const dir = setupReportDir();
    expect(fs.existsSync(dir)).toBe(true);
  });

  test("writeMarkdownReport should generate a file with findings", () => {
    const mockReviews = [
      {
        line: 10,
        severity: "High" as const,
        finding: "Test finding",
        impact: "Test impact",
        recommendation: "Test recommendation"
      }
    ];
    
    const dir = setupReportDir();
    const filePath = writeMarkdownReport("test-file.ts", mockReviews, dir);
    
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Test finding");
    expect(content).toContain("High");
    
    // Cleanup
    fs.unlinkSync(filePath);
  });
});
