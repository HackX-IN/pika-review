import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { calculateGrade, getGradeColor, generateBadge } from "../src/core/stats.js";

describe("Grading & Gamification Statistics", () => {
  const badgePath = path.join(process.cwd(), "badge.svg");
  let originalBadgeContent: string | null = null;

  beforeAll(() => {
    if (fs.existsSync(badgePath)) {
      originalBadgeContent = fs.readFileSync(badgePath, "utf-8");
    }
  });

  afterAll(() => {
    if (originalBadgeContent !== null) {
      fs.writeFileSync(badgePath, originalBadgeContent, "utf-8");
    } else if (fs.existsSync(badgePath)) {
      fs.unlinkSync(badgePath);
    }
  });

  test("calculateGrade should compute exact grades based on severity counts", () => {
    // 1. Grade A+: No findings or only Low issues
    const findingsAp = [{ reviews: [{ severity: "Low" }] }];
    expect(calculateGrade(findingsAp)).toBe("A+");

    // 2. Grade A: One medium issue
    const findingsA = [{ reviews: [{ severity: "Medium" }] }];
    expect(calculateGrade(findingsA)).toBe("A");

    // 3. Grade B: One high or multiple medium issues
    const findingsB = [{ reviews: [{ severity: "High" }] }];
    expect(calculateGrade(findingsB)).toBe("B");

    // 4. Grade C: One critical or multiple high issues
    const findingsC = [{ reviews: [{ severity: "Critical" }] }];
    expect(calculateGrade(findingsC)).toBe("C");

    // 5. Grade F: Multiple critical issues
    const findingsF = [{ reviews: [{ severity: "Critical" }, { severity: "Critical" }] }];
    expect(calculateGrade(findingsF)).toBe("F");
  });

  test("generateBadge should write a valid visual SVG asset", () => {
    generateBadge("A+");
    expect(fs.existsSync(badgePath)).toBe(true);

    const svg = fs.readFileSync(badgePath, "utf-8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("Pika Sentinel");
    expect(svg).toContain("A+");
    expect(svg).toContain(getGradeColor("A+"));
  });
});
