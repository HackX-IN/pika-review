import fs from "fs";
import chalk from "chalk";
import { execSync } from "child_process";

/**
 * Extracts the first markdown fenced code block from a recommendation string.
 */
export function extractCodeBlock(markdown: string): string | null {
  // Regex matches triple backtick block with optional language identifier
  const match = markdown.match(/```[a-zA-Z]*\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

/**
 * Patches a target file in-place with an AI code block at a specific line number.
 * Preserves the original indentation of the line being replaced.
 */
export function applyAutoFix(filePath: string, lineNum: number | undefined, recommendation: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  ${chalk.red("✖")} Target file not found: ${filePath}`);
      return false;
    }

    const code = extractCodeBlock(recommendation);
    if (!code) {
      console.log(`  ${chalk.red("✖")} No valid code block found in recommendation to apply.`);
      return false;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);

    if (lineNum !== undefined && lineNum > 0 && lineNum <= lines.length) {
      // Find indentation of the original line to preserve nesting structure
      const indent = lines[lineNum - 1].match(/^\s*/)?.[0] || "";
      const indentedCode = code.split("\n").map(l => indent + l).join("\n");
      
      lines[lineNum - 1] = indentedCode;
      fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
      
      console.log(`\n  ${chalk.green("✓")} Clean code applied to ${chalk.bold(filePath)} at line ${lineNum}.`);
      
      // Render Git Diff for immediate visual confirmation
      try {
        console.log(`\n  ${chalk.cyan.bold("◆  Git Diff Confirmation:")}`);
        const diff = execSync(`git diff --color "${filePath}"`, { encoding: "utf-8" });
        if (diff.trim()) {
          console.log(diff);
        } else {
          console.log(`     ${chalk.dim("Lines matched exactly; no raw text diff produced.")}`);
        }
      } catch (diffErr) {
        // Fail silently if git is not initialized or diff fails
      }
      return true;
    } else {
      console.log(`  ${chalk.red("✖")} Target line number is out of bounds or undefined.`);
      return false;
    }
  } catch (e: any) {
    console.log(`  ${chalk.red("✖")} Failed to apply auto-fix: ${e.message}`);
    return false;
  }
}
