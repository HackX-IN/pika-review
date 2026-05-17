import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import OpenAI from "openai";
import { getConfig } from "../utils/config.js";

/**
 * CLI Command: discuss [file]
 * Launches an interactive Socratic chat session inside the console focusing on design context.
 */
export async function discussAction(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ${chalk.red("✖")} Target file not found: ${filePath}`);
    return;
  }

  const config = getConfig();
  const isOllama = config.ai.provider === "ollama";
  const isCloudflare = config.ai.provider === "cloudflare";

  const baseURL =
    config.ai.baseURL && config.ai.baseURL.trim()
      ? config.ai.baseURL
      : (isOllama
          ? "http://localhost:11434/v1"
          : (isCloudflare
              ? `https://api.cloudflare.com/client/v4/accounts/${config.ai.accountId}/ai/v1`
              : "https://api.openai.com/v1"));

  const openai = new OpenAI({
    apiKey: config.ai.apiKey || "ollama",
    baseURL,
  });

  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Load custom architecture standards rules if they exist
  let complianceSection = "";
  try {
    const rulesPath = ".pika-rules.md";
    if (fs.existsSync(rulesPath)) {
      complianceSection = `\nCustom Rules:\n${fs.readFileSync(rulesPath, "utf-8")}`;
    }
  } catch (e) {}

  const messages: any[] = [
    {
      role: "system",
      content: `You are an Elite Senior Full-Stack Architect and Security Mentor.
Your task is to have an interactive Socratic discussion with the developer regarding the provided file.
Help them brainstorm alternative patterns, explain the reasoning behind quality benchmarks, and walk them through refactoring steps.

Target File Path: ${filePath}
File Content:
\`\`\`
${fileContent}
\`\`\`
${complianceSection}`
    }
  ];

  console.log(`\n  ${chalk.cyan.bold("◆  Socratic Chat Started")}`);
  console.log(`     Discussing: ${chalk.bold(filePath)}`);
  console.log(`     Type ${chalk.yellow("exit")} or ${chalk.yellow("quit")} to end the session.\n`);

  while (true) {
    const userInput = await prompts({
      type: "text",
      name: "message",
      message: `${chalk.green("💬 You:")}`,
    });

    if (!userInput.message || userInput.message.trim() === "") continue;

    const trimmed = userInput.message.trim();
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
      console.log(`\n  ${chalk.cyan("→")} Discuss session finished. Happy coding!\n`);
      break;
    }

    messages.push({ role: "user", content: trimmed });

    process.stdout.write(`\n  ${chalk.cyan.bold("◆  Pika Sentinel:")}\n     `);

    try {
      const response = await openai.chat.completions.create({
        model: config.ai.model,
        messages,
        temperature: 0.2,
      });

      const reply = response.choices[0]?.message?.content || "";
      console.log(reply.split("\n").join("\n     "));
      console.log();
      messages.push({ role: "assistant", content: reply });
    } catch (e: any) {
      console.log(`${chalk.red("✖")} Error communicating with AI: ${e.message}\n`);
    }
  }
}
