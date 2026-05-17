import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { extractCodeBlock, applyAutoFix } from "../src/cmd/autofix.js";

describe("CLI Auto-Patcher Pika Engine", () => {
  const testFile = path.join(process.cwd(), "temp-fix-test.ts");

  beforeAll(() => {
    // Scaffold test file content
    const baseContent = [
      "function start() {",
      "  console.log('original line');",
      "  return 0;",
      "}",
    ].join("\n");
    fs.writeFileSync(testFile, baseContent, "utf-8");
  });

  afterAll(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  test("extractCodeBlock should isolate text inside fenced backticks", () => {
    const rawMarkdown = `
Here is a recommended correction:
\`\`\`typescript
const target = 100;
console.log(target);
\`\`\`
Good luck!
`;
    const code = extractCodeBlock(rawMarkdown);
    expect(code).not.toBeNull();
    expect(code).toContain("const target = 100;");
    expect(code).toContain("console.log(target);");
  });

  test("applyAutoFix should patch matching lines and align indentation", () => {
    const recommendation = `
\`\`\`typescript
const newContent = "replaced line";
console.log(newContent);
\`\`\`
`;
    // Apply autofix at line 2 (console.log('original line');)
    const result = applyAutoFix(testFile, 2, recommendation);
    expect(result).toBe(true);

    const patchedContent = fs.readFileSync(testFile, "utf-8");
    const lines = patchedContent.split("\n");

    // The line should be replaced and maintain the "  " (2-space) indentation of the original line 2
    expect(lines[1]).toBe("  const newContent = \"replaced line\";");
    expect(lines[2]).toBe("  console.log(newContent);");
  });
});
