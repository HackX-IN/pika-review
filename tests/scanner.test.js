import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { listProjectFiles } from "../src/core/scanner.js";
import fs from "fs";
import path from "path";
describe("Scanner Core", () => {
    const testDir = path.join(process.cwd(), "temp-test-dir");
    beforeAll(() => {
        if (fs.existsSync(testDir))
            fs.rmSync(testDir, { recursive: true });
        fs.mkdirSync(testDir);
        fs.mkdirSync(path.join(testDir, "src"));
        fs.mkdirSync(path.join(testDir, "node_modules"));
        fs.writeFileSync(path.join(testDir, "src/index.ts"), "content");
        fs.writeFileSync(path.join(testDir, "node_modules/package.json"), "content");
        fs.writeFileSync(path.join(testDir, ".git"), "content");
    });
    afterAll(() => {
        fs.rmSync(testDir, { recursive: true });
    });
    test("listProjectFiles should recursively find files while respecting ignores", () => {
        const files = listProjectFiles(testDir);
        // Should find source files
        expect(files.some(f => f.includes("src/index.ts"))).toBe(true);
        // Should NOT find ignored folders/files
        expect(files.some(f => f.includes("node_modules"))).toBe(false);
        expect(files.some(f => f.includes(".git"))).toBe(false);
    });
});
