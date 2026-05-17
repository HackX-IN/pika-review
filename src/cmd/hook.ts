import fs from "fs";
import path from "path";
import chalk from "chalk";
import { logger } from "../utils/logger.js";

/**
 * CLI Command Action: hook [action]
 * Manages the Git pre-commit hook installation/removal.
 */
export async function hookAction(action: "install" | "uninstall") {
  const gitPath = path.join(process.cwd(), ".git");

  if (!fs.existsSync(gitPath)) {
    logger.error("Not a Git repository.");
    logger.dim("Pika Review Git hooks can only be installed in the root of a Git repository.");
    return;
  }

  const hooksPath = path.join(gitPath, "hooks");
  const hookFile = path.join(hooksPath, "pre-commit");

  // Ensure hooks directory exists
  if (!fs.existsSync(hooksPath)) {
    fs.mkdirSync(hooksPath, { recursive: true });
  }

  const HOOK_SCRIPT = `#!/bin/sh
# Pika Review - Architectural Sentinel Git Safeguard Hook
echo "🦊 Running local architectural compliance checks..."
pika-review scan --ci

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ [Pika Review] Commit rejected due to high-severity compliance anomalies."
  exit $EXIT_CODE
fi

exit 0
`;

  if (action === "install") {
    let backupCreated = false;

    if (fs.existsSync(hookFile)) {
      const content = fs.readFileSync(hookFile, "utf-8");
      if (content.includes("Pika Review")) {
        logger.info("Pika Review hook is already installed!");
        return;
      }

      // Create backup of existing hook
      const backupPath = `${hookFile}.bak`;
      fs.writeFileSync(backupPath, content);
      backupCreated = true;
      logger.info(`Existing hook backed up to ${chalk.cyan("pre-commit.bak")}`);
    }

    try {
      fs.writeFileSync(hookFile, HOOK_SCRIPT, { mode: 0o755 });
      logger.success("Git pre-commit hook installed successfully!");
      logger.info(`Path: ${chalk.dim(hookFile)}`);
      logger.dim("Pika Review will now scan your staged files automatically before every commit.");
    } catch (e: any) {
      logger.error(`Failed to install Git hook: ${e.message}`);
    }
  } else if (action === "uninstall") {
    if (!fs.existsSync(hookFile)) {
      logger.warn("No pre-commit hook found to uninstall.");
      return;
    }

    const content = fs.readFileSync(hookFile, "utf-8");
    if (!content.includes("Pika Review")) {
      logger.warn("The existing pre-commit hook was not installed by Pika Review. Leaving it untouched.");
      return;
    }

    try {
      fs.unlinkSync(hookFile);
      logger.success("Pika Review Git pre-commit hook uninstalled successfully.");

      // Restore backup if it exists
      const backupPath = `${hookFile}.bak`;
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, hookFile);
        // Make sure it remains executable
        fs.chmodSync(hookFile, 0o755);
        logger.success("Restored previous pre-commit hook from backup!");
      }
    } catch (e: any) {
      logger.error(`Failed to uninstall Git hook: ${e.message}`);
    }
  }
}
