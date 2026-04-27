import { expect, test, describe } from "bun:test";
import { setupReportDir, writeMarkdownReport, writeHTMLReport } from "../src/core/reporter.js";
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

  test("writeHTMLReport should generate report and update history.json", () => {
    const mockFindings = [
      {
        fileName: "src/test.ts",
        reviews: [
          {
            line: 5,
            severity: "Critical" as const,
            finding: "Logic error",
            impact: "System crash",
            recommendation: "Fix it"
          }
        ]
      }
    ];

    const dir = setupReportDir();
    const htmlPath = writeHTMLReport(dir, 1, mockFindings);
    
    expect(fs.existsSync(htmlPath)).toBe(true);
    const htmlContent = fs.readFileSync(htmlPath, "utf-8");
    expect(htmlContent).toContain("Critical");
    expect(htmlContent).toContain("Logic error");

    // Verify history.json
    const historyPath = path.join(process.cwd(), ".pika-reports", "history.json");
    expect(fs.existsSync(historyPath)).toBe(true);
    const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].totalIssues).toBe(1);
  });
});
