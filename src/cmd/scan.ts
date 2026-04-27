import prompts from "prompts";
import chalk from "chalk";
import { runScan, getDiffFiles, listProjectFiles } from "../core/scanner.js";
import { logger } from "../utils/logger.js";

/**
 * CLI Command: scan
 * Executes the scanning logic and handles user interaction for reports.
 */
export async function scanAction(files: string[], options: any) {
  const target = options.unstaged ? "unstaged" : "staged";
  const isCI = !!options.ci;

  let targets = files.length > 0 ? files : undefined;

  // Interactive Discovery: If requested or if no files provided and no git changes
  if (!isCI && (options.interactive || (!targets && getDiffFiles(target).length === 0))) {
    logger.info("Entering interactive selection mode...");
    const allFiles = listProjectFiles();
    
    if (allFiles.length > 0) {
      const selection = await prompts({
        type: "multiselect",
        name: "files",
        message: "Select files to analyze (Space to select, Enter to confirm):",
        choices: allFiles.map(f => ({ title: f, value: f })),
        hint: "- Space to select. Return to submit",
        instructions: false
      });

      if (selection.files && selection.files.length > 0) {
        targets = selection.files;
      } else if (options.interactive) {
        logger.warn("No files selected. Exiting.");
        return;
      }
    }
  }

  let reports = await runScan(target, isCI, targets);

  if (!reports || reports.length === 0) {
    if (!isCI) {
      logger.success("Scan complete. No critical architectural anomalies detected.");
      logger.dim("Try scanning with '--unstaged' if you have uncommitted changes.");
    }
    return;
  }

  if (!isCI) {
    console.log(chalk.bold(`\n${"=".repeat(50)}`));
    logger.warn(`ANALYTICAL REPORT READY`);
    logger.dim(`${reports.length} file(s) require your immediate attention.\n`);

    const response = await prompts({
      type: "select",
      name: "action",
      message: "What is your next step?",
      choices: [
        { title: "📂 Open generated Markdown reports", value: "view" },
        { title: "🛑 Exit and start refactoring", value: "exit" },
      ],
      initial: 0,
    });

    if (response.action === "view") {
      logger.info("\nGenerated Artifacts:");
      reports.forEach((r) => {
        const fileName = r.split("/").pop();
        console.log(` ${chalk.cyan("→")} ${chalk.bold(fileName)} ${chalk.dim(`(${r})`)}`);
      });
      console.log(chalk.dim("\nTip: Use 'cat' or a Markdown viewer to read the findings."));
    }
  }
}
