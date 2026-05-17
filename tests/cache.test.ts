import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { computeScanHash, getCache, setCache } from "../src/core/cache.js";

describe("Semantic Cache Engine", () => {
  const cacheFile = path.join(".pika-reports", "cache.json");
  let originalCacheContent: string | null = null;

  beforeAll(() => {
    // Preserve existing cache if any
    if (fs.existsSync(cacheFile)) {
      originalCacheContent = fs.readFileSync(cacheFile, "utf-8");
    }
  });

  afterAll(() => {
    // Restore existing cache
    if (originalCacheContent !== null) {
      fs.writeFileSync(cacheFile, originalCacheContent, "utf-8");
    } else if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  });

  test("computeScanHash should return stable and deterministic hashes", () => {
    const files = [
      { filePath: "src/a.ts", content: "console.log('A')" },
      { filePath: "src/b.ts", content: "console.log('B')" },
    ];
    const rules = "# Strict Rules";

    const hash1 = computeScanHash(files, rules);
    const hash2 = computeScanHash(files, rules);
    
    // Hash order of files array should be sorted and deterministic
    const shuffledFiles = [
      { filePath: "src/b.ts", content: "console.log('B')" },
      { filePath: "src/a.ts", content: "console.log('A')" },
    ];
    const hash3 = computeScanHash(shuffledFiles, rules);

    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 length hex string
  });

  test("setCache and getCache should store and recover reviews perfectly", () => {
    const mockHash = "test_sha256_hash_signature_value";
    const mockPayload = {
      markdownReports: ["report-a.md"],
      htmlReport: "report.html",
      findings: [
        {
          fileName: "src/a.ts",
          reviews: [
            { line: 5, severity: "High" as const, finding: "Test", impact: "None", recommendation: "Fix" }
          ]
        }
      ]
    };

    setCache(mockHash, mockPayload);
    const retrieved = getCache(mockHash);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.htmlReport).toBe("report.html");
    expect(retrieved?.markdownReports[0]).toBe("report-a.md");
    expect(retrieved?.findings.length).toBe(1);
    expect(retrieved?.findings[0].reviews[0].line).toBe(5);
  });
});
