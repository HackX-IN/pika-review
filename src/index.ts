#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initAction } from "./cmd/init.js";
import { scanAction } from "./cmd/scan.js";
import { logger } from "./utils/logger.js";

/**
 * Pika Review: The Enterprise-Grade AI Code Reviewer.
 * Modular entry point for CLI operations.
 */
const program = new Command();

// Branding Header
const BRAND = `
  ${chalk.bgCyan.black.bold(" PIKA REVIEW ")} ${chalk.dim("v2.0.0")}
  ${chalk.italic.gray("Enterprise-grade AI Architectural Sentinel")}
`;

const HELPER_TEXT = `
${chalk.bold.cyan("🚀 Quick Start:")}
  $ pika-review scan           ${chalk.dim("# Scan staged git changes (default)")}
  $ pika-review scan -u        ${chalk.dim("# Scan unstaged git changes")}
  $ pika-review scan file.ts   ${chalk.dim("# Scan a specific file")}
  $ pika-review scan f1 f2     ${chalk.dim("# Scan multiple specific files")}

${chalk.bold.cyan("⌨️  Shortcuts & Tips:")}
  - Use ${chalk.yellow("--ci")} in GitHub Actions to fail on Critical/High issues.
  - Create a ${chalk.yellow(".pikaignore")} file to skip specific directories.
  - Review artifacts are stored in ${chalk.yellow(".pika-reports/")} automatically.

${chalk.bold.cyan("📊 Progress & Concurrency:")}
  - Pika uses ${chalk.green("p-limit(3)")} to scan files in parallel without hitting rate limits.
  - Real-time progress bars will show you the exact status of each analysis.
`;

program
  .name("pika-review")
  .description("Enterprise-grade AI Code Reviewer for Cloudflare Workers AI")
  .version("2.0.0")
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
  .command("scan [files...]", { isDefault: true }) // Set scan as the default command
  .description("Scan git changes or specific files for architectural anomalies")
  .option("-u, --unstaged", "Analyze unstaged changes instead of staged")
  .option("--ci", "Headless CI/CD mode (fails on Critical/High issues, strips visuals)")
  .action(async (files, options) => {
    // Only show branding if not in CI mode and if files were explicitly passed or if it's the default
    if (!options.ci) console.log(BRAND);
    await scanAction(files, options);
  });

program.parse();
