import prompts from "prompts";
import chalk from "chalk";
import { execSync } from "child_process";
import { runScan, getDiffFiles, listProjectFiles } from "../core/scanner.js";
import { logger } from "../utils/logger.js";
import { applyAutoFix } from "./autofix.js";
import { postGitHubPRComments } from "./github.js";

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

  const { markdownReports, htmlReport, findings } = await runScan(target, isCI, targets);

  // If in CI and GITHUB_TOKEN is present, automatically post reviews
  if (isCI && process.env.GITHUB_TOKEN && process.env.GITHUB_EVENT_PATH) {
    await postGitHubPRComments(findings);
  }

  if (!markdownReports || markdownReports.length === 0) {
    if (!isCI) {
      console.log(`\n  ${chalk.green("✓")}  ${chalk.bold("Scan complete. No architectural anomalies or security risks detected.")}`);
      console.log(`     ${chalk.dim("Try scanning with '--unstaged' if you have unstaged changes.")}\n`);
    }
    return;
  }

  if (!isCI) {
    // Count findings by severity
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalIssues = 0;

    findings.forEach((f: any) => {
      totalIssues += f.reviews.length;
      f.reviews.forEach((r: any) => {
        if (r.severity === "Critical") criticalCount++;
        else if (r.severity === "High") highCount++;
        else if (r.severity === "Medium") mediumCount++;
        else if (r.severity === "Low") lowCount++;
      });
    });

    // Sleek summary box
    console.log(`\n  ${chalk.cyan.bold("◆  Scan Completed Successfully")}`);
    console.log(`     ${chalk.dim("─".repeat(34))}`);
    console.log(`     ${chalk.bold("Files Audited:")}   ${findings.length}`);
    console.log(`     ${chalk.bold("Total Findings:")}  ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log(`\n     ${chalk.bold("Severity Breakdown:")}`);
      if (criticalCount > 0) console.log(`       🚨 ${chalk.red.bold(criticalCount)} Critical`);
      if (highCount > 0)     console.log(`       🔥 ${chalk.yellow.bold(highCount)} High`);
      if (mediumCount > 0)   console.log(`       ⚠️ ${chalk.blue.bold(mediumCount)} Medium`);
      if (lowCount > 0)      console.log(`       📝 ${chalk.gray.bold(lowCount)} Low`);
    }
    
    console.log(`\n     ${chalk.bold("Obsidian Report:")}  ${chalk.cyan.underline(`file://${htmlReport}`)}\n`);

    const response = await prompts({
      type: "select",
      name: "action",
      message: "Choose post-scan action:",
      choices: [
        { title: "✨ Open Interactive HTML Dashboard (Recommended)", value: "html" },
        { title: "🔧 Launch Interactive Auto-Fixer", value: "autofix" },
        { title: "📂 List generated Markdown file paths", value: "markdown" },
        { title: "🛑 Exit and start refactoring", value: "exit" },
      ],
      initial: 0,
    });

    if (response.action === "html") {
      console.log(`\n  ${chalk.cyan("→")} Opening interactive report in browser...`);
      try {
        const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
        execSync(`${command} "${htmlReport}"`);
      } catch (e) {
        console.log(`     ${chalk.red("✖")} Failed to open browser automatically.`);
        console.log(`     ${chalk.dim(`Manually open: file://${htmlReport}`)}`);
      }
    } else if (response.action === "autofix") {
      const fixableIssues: { title: string; value: any }[] = [];
      
      findings.forEach((f: any) => {
        f.reviews.forEach((r: any) => {
          if (r.line) {
            fixableIssues.push({
              title: `[${r.severity}] ${f.fileName}:${r.line} - ${r.finding.substring(0, 45)}...`,
              value: { filePath: f.fileName, review: r }
            });
          }
        });
      });

      if (fixableIssues.length === 0) {
        console.log(`\n  ${chalk.yellow("⚠")} No fixable issues with valid line numbers found.`);
      } else {
        const issueSelect = await prompts({
          type: "select",
          name: "issue",
          message: "Select an architectural issue to auto-patch:",
          choices: fixableIssues,
        });

        if (issueSelect.issue) {
          const { filePath, review } = issueSelect.issue;
          applyAutoFix(filePath, review.line, review.recommendation);
        }
      }
    } else if (response.action === "markdown") {
      console.log(`\n  ${chalk.bold("Generated Markdown Artifacts:")}`);
      markdownReports.forEach((r: string) => {
        const fileName = r.split("/").pop();
        console.log(`    ${chalk.cyan("•")} ${chalk.bold(fileName)} ${chalk.dim(`(file://${r})`)}`);
      });
      console.log(`\n  ${chalk.dim("Tip: Click any file:// link above to open directly in your editor.")}\n`);
    }
  }
}
