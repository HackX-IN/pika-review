import fs from "fs";
import chalk from "chalk";

/**
 * Automates Pull Request inline code-reviews by posting reviews directly to GitHub.
 * Utilizes lightweight native fetch calls to keep dependencies at zero.
 */
export async function postGitHubPRComments(findings: any[]): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!token || !eventPath) {
    return false;
  }

  try {
    if (!fs.existsSync(eventPath)) {
      console.log(`  ${chalk.red("✖")} GITHUB_EVENT_PATH file not found.`);
      return false;
    }

    const event = JSON.parse(fs.readFileSync(eventPath, "utf-8"));
    const prNumber = event.pull_request?.number;
    const repoFullName = event.repository?.full_name; // e.g. "owner/repo"

    if (!prNumber || !repoFullName) {
      console.log(`  ${chalk.red("✖")} Missing PR number or Repository Name in GitHub Event.`);
      return false;
    }

    // Get current head commit SHA required for target PR diff annotations
    const commitSha = event.pull_request?.head?.sha;
    if (!commitSha) {
      console.log(`  ${chalk.red("✖")} Head Commit SHA is missing.`);
      return false;
    }

    console.log(`\n  ${chalk.cyan("→")} Syncing ${findings.length} findings with GitHub PR #${prNumber}...`);

    for (const f of findings) {
      const fileName = f.fileName;
      for (const r of f.reviews) {
        if (!r.line) continue;

        const body = `### 🚨 Pika Sentinel: ${r.severity} Finding
**Finding:** ${r.finding}
**Impact:** ${r.impact}

**Recommendation:**
\`\`\`
${r.recommendation}
\`\`\`
`;

        const url = `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/comments`;
        const payload = {
          body,
          commit_id: commitSha,
          path: fileName,
          side: "RIGHT",
          line: r.line,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Pika-Sentinel-Reviewer"
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errMsg = await response.text();
          console.log(`     ${chalk.red("✖")} Failed to post comment on ${fileName}:${r.line}: ${errMsg}`);
        } else {
          console.log(`     ${chalk.green("✓")} Posted inline review on ${fileName}:${r.line}`);
        }
      }
    }
    return true;
  } catch (e: any) {
    console.log(`  ${chalk.red("✖")} Failed to post comments to GitHub PR: ${e.message}`);
    return false;
  }
}
