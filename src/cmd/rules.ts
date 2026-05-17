import fs from "fs";
import path from "path";
import prompts from "prompts";
import chalk from "chalk";
import OpenAI from "openai";
import { getConfig } from "../utils/config.js";
import { listProjectFiles } from "../core/scanner.js";
import { logger } from "../utils/logger.js";

/**
 * CLI Command Action: rules generate
 * Uses the configured AI provider to bootstrap architectural rules tailored to the current codebase.
 */
export async function rulesAction() {
  const config = getConfig();

  const isOllama = config.ai.provider === "ollama";
  if (!isOllama && (!config.ai.apiKey || !config.ai.accountId)) {
    logger.error("Missing AI credentials in ~/.pika-review.yaml.");
    logger.info("Run 'pika-review init' to initialize config or set provider to 'ollama' for offline mode.");
    return;
  }

  const rulesPath = path.join(process.cwd(), ".pika-rules.md");
  if (fs.existsSync(rulesPath)) {
    const overwrite = await prompts({
      type: "confirm",
      name: "confirm",
      message: "An existing .pika-rules.md already exists. Do you want to overwrite it?",
      initial: false,
    });

    if (!overwrite.confirm) {
      logger.info("Operation cancelled.");
      return;
    }
  } else {
    const confirm = await prompts({
      type: "confirm",
      name: "confirm",
      message: "Generate a custom, AI-crafted .pika-rules.md architectural guidelines guide for this codebase?",
      initial: true,
    });

    if (!confirm.confirm) {
      logger.info("Operation cancelled.");
      return;
    }
  }

  logger.info("Analyzing codebase structure and dependencies...");

  // 1. Gather package.json context
  let projectTechStack = "";
  const frameworkClassifications: string[] = [];
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const allDeps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
      
      if (allDeps["next"]) frameworkClassifications.push("Next.js Framework");
      if (allDeps["react"]) frameworkClassifications.push("React UI Library");
      if (allDeps["express"]) frameworkClassifications.push("Express.js Server");
      if (allDeps["tailwindcss"]) frameworkClassifications.push("Tailwind CSS v4 styling");
      if (allDeps["typescript"]) frameworkClassifications.push("TypeScript Static Typings");
      if (allDeps["bun-types"] || allDeps["@types/bun"]) frameworkClassifications.push("Bun High-Performance Runtime");

      const deps = Object.keys(packageJson.dependencies || {}).join(", ");
      const devDeps = Object.keys(packageJson.devDependencies || {}).join(", ");
      projectTechStack += `Package Name: ${packageJson.name || "unknown"}\nDependencies: ${deps || "none"}\nDevDependencies: ${devDeps || "none"}\n`;
    }
  } catch (e) {}

  if (frameworkClassifications.length > 0) {
    projectTechStack += `Detected Frameworks & Archetypes: ${frameworkClassifications.join(", ")}\n`;
  }

  // 2. Gather file layout context
  const files = listProjectFiles();
  const fileSummary = files.slice(0, 30).map(f => ` - ${f}`).join("\n");
  const projectStructure = `Detected files (subset):\n${fileSummary}\nTotal files discovered: ${files.length}\n`;

  logger.info(`Synthesizing tailored rules using AI model (${chalk.green(config.ai.model)})...`);

  const prompt = `You are an Elite Senior Software Architect and Compliance Officer.
Your task is to write a highly detailed, professional, and practical architectural rules file called ".pika-rules.md" for a project with the following tech stack and structure:

<project_tech_stack>
${projectTechStack || "Generic web/software codebase"}
</project_tech_stack>

<project_structure>
${projectStructure}
</project_structure>

Instructions:
- Write the output in clean, professional Markdown format.
- Establish 5 to 8 strict, concrete, actionable architectural rules tailored to the libraries, patterns, and folder layout of this specific project (e.g. naming conventions, folder segregation, API patterns, state management, security).
- Provide a brief justification for each rule.
- Do NOT output any preamble, greeting, markdown backticks wrapper, or postscript.
- Start directly with "# Pika Architectural Rules" and start rules lists immediately.`;

  const baseURL =
    config.ai.baseURL && config.ai.baseURL.trim()
      ? config.ai.baseURL
      : (isOllama
          ? "http://localhost:11434/v1"
          : `https://api.cloudflare.com/client/v4/accounts/${config.ai.accountId}/ai/v1`);

  const openai = new OpenAI({
    apiKey: config.ai.apiKey || "ollama",
    baseURL,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    let rawMarkdown = response.choices[0]?.message?.content || "";
    
    // Clean code block ticks if LLM ignored instructions
    rawMarkdown = rawMarkdown
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();

    if (!rawMarkdown.startsWith("#")) {
      rawMarkdown = `# Pika Architectural Rules\n\n${rawMarkdown}`;
    }

    fs.writeFileSync(rulesPath, rawMarkdown, "utf-8");
    logger.success(".pika-rules.md generated successfully!");
    logger.info(`Location: ${chalk.dim(rulesPath)}`);
    logger.dim("The local Pika Review engine will now enforce these rules during future scans!");
  } catch (error: any) {
    logger.error(`Failed to generate rules: ${error.message}`);
  }
}
