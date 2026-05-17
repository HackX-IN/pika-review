#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initAction } from "./cmd/init.js";
import { scanAction } from "./cmd/scan.js";
import { viewAction } from "./cmd/view.js";
import { statsAction } from "./cmd/stats.js";
import { modelsAction } from "./cmd/models.js";
import { hookAction } from "./cmd/hook.js";
import { rulesAction } from "./cmd/rules.js";
import { discussAction } from "./cmd/chat.js";
import { logger } from "./utils/logger.js";

/**
 * Pika Review: The Enterprise-Grade AI Code Reviewer.
 * Modular entry point for CLI operations.
 */
// Get package.json version dynamically
let version = "2.3.0";
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pkgPath = path.join(__dirname, "../package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.version) version = pkg.version;
  }
} catch (e) {}

const program = new Command();

// Branding Header
const BRAND = `
  ${chalk.cyan.bold("◆  Pika Sentinel")}  ${chalk.dim(`v${version} (Enterprise)`)}
  ${chalk.dim("─".repeat(42))}
  ${chalk.italic.gray("AI Architectural & Security Safeguard")}
`;

const HELPER_TEXT = `
  ${chalk.cyan.bold("Commands:")}
    ${chalk.bold("scan")}               Scan git staged changes for issues (default)
      -u, --unstaged     Scan unstaged changes instead of staged
      -i, --interactive  Interactively pick files to scan
      --ci               Fail CI pipeline if critical/high issues are found
    ${chalk.bold("view")}               Open the latest interactive HTML report in browser
    ${chalk.bold("discuss [file]")}     Launch an interactive Socratic chat session inside the console
    ${chalk.bold("stats")}              Print scan history & key quality trends
    ${chalk.bold("models")}             Interactively select Ollama models for offline audit
    ${chalk.bold("hook")}               Install Git pre-commit safeguard hook
    ${chalk.bold("rules")}              AI-generate architectural '.pika-rules.md'

  ${chalk.cyan.bold("Options & Advanced:")}
    • Custom Rules:   Create a ${chalk.yellow(".pika-rules.md")} to feed custom codebase standards to the AI.
    • Bypasses:       Add ${chalk.yellow("// pika-ignore")} or ${chalk.yellow("/* pika-ignore */")} in code to skip lines.
    • Local LLM:      Select an offline model via '${chalk.green("pika-review models")}' for passwordless private runs.
`;

program
  .name("pika-review")
  .description("Enterprise-grade AI Architectural Code Reviewer")
  .version(version)
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
  .command("discuss <file>")
  .description("Launch an interactive Socratic chat session inside the console focusing on design context")
  .action(async (file) => {
    console.log(BRAND);
    await discussAction(file);
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
