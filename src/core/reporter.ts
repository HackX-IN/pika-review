import fs from "fs";
import path from "path";

/**
 * Report Orchestrator: Handles persistence of AI findings.
 */
export function setupReportDir(): string {
  const reportDir = path.join(process.cwd(), ".pika-reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignore.includes(".pika-reports")) {
      fs.appendFileSync(gitignorePath, "\n.pika-reports/\n");
    }
  }
  return reportDir;
}

/**
 * Generates a professional Markdown report.
 */
export function writeMarkdownReport(
  fileName: string,
  reviews: any[],
  reportDir: string,
): string {
  const safeName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const reportPath = path.join(reportDir, `${safeName}_review.md`);
  const timestamp = new Date().toLocaleString();

  let mdContent = `# 🔍 Pika Review: \`${fileName}\`\n\n`;
  mdContent += `> **Generated on:** ${timestamp}\n`;
  mdContent += `> **Total Issues Found:** ${reviews.length}\n\n`;

  reviews.forEach((issue) => {
    const iconMap = {
      Critical: "🚨",
      High: "🔥",
      Medium: "⚠️",
      Low: "📝",
    };
    const icon = iconMap[issue.severity as keyof typeof iconMap] || "⚠️";

    mdContent += `## ${icon} [${issue.severity}] Line ${issue.line || "N/A"}\n\n`;
    mdContent += `### 💡 Finding\n${issue.finding}\n\n`;
    mdContent += `### 💥 Impact\n${issue.impact}\n\n`;
    mdContent += `### 🛠️ Recommendation\n`;
    
    // Attempt to detect language for syntax highlighting
    const ext = path.extname(fileName).slice(1) || "typescript";
    mdContent += `\`\`\`${ext}\n${issue.recommendation}\n\`\`\`\n\n`;
    mdContent += `---\n\n`;
  });

  fs.writeFileSync(reportPath, mdContent);
  return reportPath;
}
