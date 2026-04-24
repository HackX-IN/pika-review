import { expect, test, describe } from "bun:test";
import { getIgnoredFiles } from "../src/utils/config.js";

describe("Config Utility", () => {
  test("getIgnoredFiles should return a comprehensive list by default", () => {
    const ignores = getIgnoredFiles();
    expect(ignores).toContain("node_modules");
    expect(ignores).toContain(".git");
    expect(ignores).toContain("dist");
    expect(ignores).toContain(".next");
    expect(ignores).toContain("venv");
  });
});
