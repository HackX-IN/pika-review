import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import { logger } from "../utils/logger.js";

/**
 * View Action: Finds and opens the latest HTML report.
 */
export async function viewAction() {
  const rootReportDir = path.join(process.cwd(), ".pika-reports");

  if (!fs.existsSync(rootReportDir)) {
    logger.error("No reports found. Run a scan first!");
    return;
  }

  // Get project directories (e.g. .pika-reports/pika-review/)
  const projectDirs = fs.readdirSync(rootReportDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (projectDirs.length === 0) {
    logger.error("No reports found. Run a scan first!");
    return;
  }

  // Find all report.html files across all projects and timestamps
  const allReports: { path: string; mtime: number }[] = [];

  for (const project of projectDirs) {
    const projectPath = path.join(rootReportDir, project);
    const timestamps = fs.readdirSync(projectPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const ts of timestamps) {
      const reportPath = path.join(projectPath, ts, "report.html");
      if (fs.existsSync(reportPath)) {
        allReports.push({
          path: reportPath,
          mtime: fs.statSync(reportPath).mtimeMs
        });
      }
    }
  }

  if (allReports.length === 0) {
    logger.error("No HTML reports found. Run a scan first!");
    return;
  }

  // Sort by modification time (latest first)
  allReports.sort((a, b) => b.mtime - a.mtime);

  const latestReport = allReports[0].path;
  logger.info(`Opening latest report: ${chalk.cyan(latestReport)}`);

  try {
    const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    execSync(`${command} "${latestReport}"`);
  } catch (e) {
    logger.error("Failed to open the report automatically. Please open it manually.");
  }
}
