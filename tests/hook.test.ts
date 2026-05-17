import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { hookAction } from "../src/cmd/hook.js";
import fs from "fs";
import path from "path";

describe("Git Safeguard Hook Installer", () => {
  const testRepoDir = path.join(process.cwd(), "temp-git-repo");
  const gitDir = path.join(testRepoDir, ".git");
  const hooksDir = path.join(gitDir, "hooks");
  const hookFile = path.join(hooksDir, "pre-commit");
  const backupFile = `${hookFile}.bak`;

  let originalCwd: () => string;

  beforeAll(() => {
    // Scaffold mock git repository directory structures
    if (fs.existsSync(testRepoDir)) {
      fs.rmSync(testRepoDir, { recursive: true });
    }
    fs.mkdirSync(testRepoDir);
    fs.mkdirSync(gitDir);

    // Mock process.cwd() to return our test repository folder
    originalCwd = process.cwd;
    process.cwd = () => testRepoDir;
  });

  afterAll(() => {
    // Restore original cwd and clean up disk
    process.cwd = originalCwd;
    if (fs.existsSync(testRepoDir)) {
      fs.rmSync(testRepoDir, { recursive: true });
    }
  });

  test("should fail if running outside a Git repository", async () => {
    // Temporarily mock non-git folder CWD
    const tempNonGit = path.join(testRepoDir, "nongit");
    fs.mkdirSync(tempNonGit);
    
    process.cwd = () => tempNonGit;
    
    // Attempting to install should log error and not create any pre-commit hooks
    await hookAction("install");
    expect(fs.existsSync(path.join(tempNonGit, ".git/hooks/pre-commit"))).toBe(false);

    // Restore test repository CWD
    process.cwd = () => testRepoDir;
  });

  test("should successfully install pre-commit hook in a Git repository", async () => {
    await hookAction("install");
    
    expect(fs.existsSync(hookFile)).toBe(true);
    const content = fs.readFileSync(hookFile, "utf-8");
    expect(content).toContain("Pika Review");
    expect(content).toContain("pika-review scan --ci");
  });

  test("should backup existing custom pre-commit hooks before installing", async () => {
    // Uninstall first to reset state
    await hookAction("uninstall");
    expect(fs.existsSync(hookFile)).toBe(false);

    // Write a dummy custom pre-commit hook simulating pre-existing user configurations
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.writeFileSync(hookFile, "#!/bin/sh\necho 'custom hook'", { mode: 0o755 });

    // Trigger installation
    await hookAction("install");

    // The active hook file should now be the Pika hook
    const content = fs.readFileSync(hookFile, "utf-8");
    expect(content).toContain("Pika Review");

    // A backup file should have been created holding the original user contents
    expect(fs.existsSync(backupFile)).toBe(true);
    const backupContent = fs.readFileSync(backupFile, "utf-8");
    expect(backupContent).toContain("echo 'custom hook'");
  });

  test("should uninstall cleanly and restore user backups", async () => {
    // Trigger uninstallation
    await hookAction("uninstall");

    // Pika hook should be uninstalled
    // Since a backup existed, the backup file should have been renamed back to the pre-commit hook file
    expect(fs.existsSync(backupFile)).toBe(false);
    expect(fs.existsSync(hookFile)).toBe(true);

    // The restored file should contain the original user script
    const restoredContent = fs.readFileSync(hookFile, "utf-8");
    expect(restoredContent).toContain("echo 'custom hook'");
  });
});
