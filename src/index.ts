#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initAction } from "./cmd/init.js";
import { scanAction } from "./cmd/scan.js";
import { viewAction } from "./cmd/view.js";
import { statsAction } from "./cmd/stats.js";
import { modelsAction } from "./cmd/models.js";
import { hookAction } from "./cmd/hook.js";
import { rulesAction } from "./cmd/rules.js";
import { logger } from "./utils/logger.js";

/**
 * Pika Review: The Enterprise-Grade AI Code Reviewer.
 * Modular entry point for CLI operations.
 */
const program = new Command();

// Branding Header
const BRAND = `
  ${chalk.bgCyan.black.bold(" PIKA REVIEW ")} ${chalk.dim("v2.1.0 Enterprise")}
  ${chalk.italic.gray("AI Architectural Sentinel & Compliance Engine")}
`;

const HELPER_TEXT = `
${chalk.bold.cyan("🚀 Quick Start:")}
  $ pika-review scan           ${chalk.dim("# Scan staged git changes (default)")}
  $ pika-review scan -i        ${chalk.dim("# Interactive file selection mode")}
  $ pika-review view           ${chalk.dim("# Open the latest interactive report")}
  $ pika-review stats          ${chalk.dim("# View architectural health trends")}
  $ pika-review models         ${chalk.dim("# Interactively configure local Ollama models")}
  $ pika-review hook install   ${chalk.dim("# Install pre-commit offline quality safeguard")}
  $ pika-review rules -g       ${chalk.dim("# AI-generate architectural .pika-rules.md")}

${chalk.bold.cyan("⌨️  Shortcuts & Tips:")}
  - Use ${chalk.yellow("--ci")} in GitHub Actions to fail on Critical/High issues.
  - Create ${chalk.yellow(".pika-rules.md")} to enforce project-specific architecture.
  - Use ${chalk.yellow("pika-ignore")} in code comments to skip specific lines.
  - Review artifacts are stored in ${chalk.yellow(".pika-reports/")} automatically.

${chalk.bold.cyan("📊 Progress & Concurrency:")}
  - Pika uses ${chalk.green("p-limit(3)")} to scan files in parallel without hitting rate limits.
  - Real-time progress bars will show you the exact status of each analysis.
`;

program
  .name("pika-review")
  .description("Enterprise-grade AI Architectural Code Reviewer")
  .version("2.1.0")
  .addHelpText("before", BRAND)
  .addHelpText("after", HELPER_TEXT);

program
  .command("init")
  .description("Initialize global configuration (~/.pika-review.yaml)")
  .action(async () => {
    console.log(BRAND);
    await initAction();
  });

program
  .command("view")
  .description("Open the latest interactive HTML report in your browser")
  .action(async () => {
    console.log(BRAND);
    await viewAction();
  });

program
  .command("stats")
  .description("View architectural health trends and scan history")
  .action(async () => {
    console.log(BRAND);
    await statsAction();
  });

program
  .command("models")
  .description("Select and configure local Ollama models interactively")
  .action(async () => {
    console.log(BRAND);
    await modelsAction();
  });

program
  .command("hook <action>")
  .description("Install or uninstall Git pre-commit scanner safeguard hook")
  .addHelpText("after", `\nActions:\n  install      Install Git pre-commit hook\n  uninstall    Remove Git pre-commit hook`)
  .action(async (action) => {
    if (action !== "install" && action !== "uninstall") {
      logger.error("Invalid action. Use 'install' or 'uninstall'.");
      process.exit(1);
    }
    console.log(BRAND);
    await hookAction(action);
  });

program
  .command("rules")
  .description("AI architectural rules utilities")
  .option("-g, --generate", "Auto-generate .pika-rules.md based on codebase")
  .action(async (options) => {
    console.log(BRAND);
    if (options.generate) {
      await rulesAction();
    } else {
      logger.info("Use 'pika-review rules --generate' to auto-generate architecture rules.");
    }
  });

program
  .command("scan [files...]", { isDefault: true }) // Set scan as the default command
  .description("Scan git changes or specific files for architectural anomalies")
  .option("-u, --unstaged", "Analyze unstaged changes instead of staged")
  .option("-i, --interactive", "Interactively select files to scan")
  .option("--ci", "Headless CI/CD mode (fails on Critical/High issues, strips visuals)")
  .action(async (files, options) => {
    // Only show branding if not in CI mode and if files were explicitly passed or if it's the default
    if (!options.ci) console.log(BRAND);
    await scanAction(files, options);
  });

program.parse();
