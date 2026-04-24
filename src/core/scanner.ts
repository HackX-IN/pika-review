import { execFileSync } from "child_process";
import fs from "fs";
import cliProgress from "cli-progress";
import pLimit from "p-limit";
import { analyzeDiff } from "./ai.js";
import { setupReportDir, writeMarkdownReport } from "./reporter.js";
import { getIgnoredFiles } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import path from "path";
import { validateTokenLimit } from "../utils/token.js";

/**
 * Project Discovery: List all relevant files for interactive selection.
 */
export function listProjectFiles(dir = ".", depth = 0): string[] {
  if (depth > 5) return []; // Limit depth for performance
  const ignores = getIgnoredFiles();
  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const isIgnored = ignores.some(ignore => item.name.includes(ignore.replace("*", "")));
      
      if (isIgnored || item.name.startsWith(".")) continue;

      if (item.isDirectory()) {
        files.push(...listProjectFiles(fullPath, depth + 1));
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Silent fail for inaccessible dirs
  }
  return files;
}

/**
 * Git Utilities: Extract file lists from the repository.
 */
export function getDiffFiles(type: "staged" | "unstaged"): string[] {
  try {
    const args = type === "staged" 
      ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"] // Only Added, Copied, Modified, Renamed
      : ["diff", "--name-only", "--diff-filter=ACMR"];
    
    const output = execFileSync("git", args, { 
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"] 
    });
    
    const ignores = getIgnoredFiles();

    return output.trim().split("\n").filter((file) => {
      const trimmedFile = file.trim();
      if (!trimmedFile) return false;
      
      // Filter out ignored patterns and ensure file exists
      const isIgnored = ignores.some(ignore => trimmedFile.includes(ignore.replace("*", "")));
      return !isIgnored && fs.existsSync(trimmedFile);
    });
  } catch (e) {
    logger.error("Git operation failed. Ensure you are in a git repository.");
    return [];
  }
}

/**
 * Scan Orchestrator: Manages the review lifecycle.
 * Concurrency is limited to 3 to stay within the Cloudflare Workers AI free tier constraints.
 */
export async function runScan(
  target: "staged" | "unstaged",
  isCI: boolean,
  specificFiles?: string[],
) {
  let files: string[] = [];

  if (specificFiles && specificFiles.length > 0) {
    specificFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        logger.error(`File not found: ${file}`);
        process.exit(1);
      }
    });
    files = specificFiles;
  } else {
    files = getDiffFiles(target);
  }

  if (files.length === 0) {
    if (!isCI) logger.success("No changes detected. Codebase is clean.");
    return [];
  }

  const reportDir = setupReportDir();
  if (!isCI) logger.info(`Initializing Pika Review on ${files.length} file(s)...`);

  const bar = isCI ? null : new cliProgress.SingleBar({
    format: ' {bar} {percentage}% | ETA: {eta}s | Scanning: {file}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  if (bar) bar.start(files.length, 0, { file: "Starting..." });

  const generatedReports: string[] = [];
  let criticalIssuesFound = false;

  const limit = pLimit(3);
  let completed = 0;

  const tasks = files.map((file) => limit(async () => {
    let contentToScan = "";

    try {
      if (specificFiles) {
        // Safety: Check file size before reading to prevent memory exhaustion
        const stats = fs.statSync(file);
        if (stats.size > 1024 * 1024) { // 1MB limit for safety
          logger.warn(`Skipping ${file}: File too large (>1MB).`);
          return;
        }
        contentToScan = fs.readFileSync(file, "utf-8");
      } else {
        try {
          contentToScan = execFileSync("git", ["diff", target === "staged" ? "--cached" : "", "--", file], { 
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"] // Suppress stderr
          });
        } catch (gitError) {
          logger.error(`Git diff failed for ${file}. Skipping.`);
          return;
        }
      }

      if (!contentToScan || !contentToScan.trim()) return;

      // Binary Detection Heuristic: Check for null bytes or control characters in the first 1KB
      if (/[\x00-\x08\x0E-\x1F]/.test(contentToScan.substring(0, 1024))) {
        logger.dim(`Skipping ${file}: Binary file detected.`);
        return;
      }

      // Token Estimator Check
      validateTokenLimit(contentToScan);

      const result = await analyzeDiff(contentToScan);
      
      if (result.reviews.length > 0) {
        const hasCritical = result.reviews.some(r => r.severity === "Critical" || r.severity === "High");
        if (hasCritical) criticalIssuesFound = true;

        const reportPath = writeMarkdownReport(file, result.reviews, reportDir);
        generatedReports.push(reportPath);
      }
    } catch (e: any) {
      if (e.message === "RATE_LIMIT") {
        if (bar) bar.stop();
        logger.critical("DAILY NEURON LIMIT REACHED (10,000). Scanning aborted.");
        process.exit(1);
      }
      logger.error(`Error scanning ${file}: ${e.message}`);
    } finally {
      completed++;
      if (bar) bar.update(completed, { file });
    }
  }));

  await Promise.all(tasks);
  if (bar) bar.stop();

  if (isCI && criticalIssuesFound) {
    logger.critical("CI Pipeline Failed: Critical issues detected.");
    process.exit(1);
  }

  return generatedReports;
}
