import fs from "fs";
import path from "path";
import chalk from "chalk";
import { logger } from "../utils/logger.js";

/**
 * Stats Action: Displays architectural health trends.
 */
export async function statsAction() {
  const historyPath = path.join(process.cwd(), ".pika-reports", "history.json");

  if (!fs.existsSync(historyPath)) {
    logger.error("No scan history found. Run some scans first!");
    return;
  }

  try {
    const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    if (history.length === 0) {
      logger.error("Scan history is empty.");
      return;
    }

    console.log(`\n${chalk.bgBlue.white.bold(" PIKA ARCHITECTURAL HEALTH DASHBOARD ")}\n`);
    console.log(`${chalk.dim("Tracking trends across the last " + history.length + " scans")}\n`);

    // Table Header
    console.log(chalk.bold("Date                Files   Issues   Critical   High   Medium   Low"));
    console.log(chalk.dim("-".repeat(75)));

    history.slice(-10).forEach((run: any) => {
      const date = new Date(run.timestamp).toLocaleString().padEnd(20);
      const files = String(run.totalFiles).padEnd(8);
      const issues = String(run.totalIssues).padEnd(9);
      
      const crit = chalk.red(String(run.severityCounts.Critical || 0).padEnd(11));
      const high = chalk.hex("#fb923c")(String(run.severityCounts.High || 0).padEnd(7));
      const med = chalk.yellow(String(run.severityCounts.Medium || 0).padEnd(9));
      const low = chalk.green(String(run.severityCounts.Low || 0).padEnd(6));

      console.log(`${date}${files}${issues}${crit}${high}${med}${low}`);
    });

    // Summary Insights
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    console.log(`\n${chalk.bold("Latest Insight:")}`);
    if (previous) {
      const diff = latest.totalIssues - previous.totalIssues;
      const direction = diff > 0 ? chalk.red("increased") : diff < 0 ? chalk.green("decreased") : "remained stable";
      console.log(`- Issue count ${direction} by ${Math.abs(diff)} since the last scan.`);
    }
    
    const critTotal = latest.severityCounts.Critical || 0;
    if (critTotal > 0) {
      console.log(`- ${chalk.red("🚨 Critical Action Required:")} ${critTotal} architectural risks detected.`);
    } else {
      console.log(`- ${chalk.green("✅ Zero Critical Issues:")} Maintain this standard!`);
    }

  } catch (e) {
    logger.error("Failed to parse history data.");
  }
}
