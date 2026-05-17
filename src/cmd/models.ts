import prompts from "prompts";
import chalk from "chalk";
import { getConfig, saveConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";

/**
 * CLI Command Action: models
 * Queries local Ollama daemon for available models and updates active configuration.
 */
export async function modelsAction() {
  const config = getConfig();

  // Extract base host from configuration baseURL or fallback to localhost
  let host = "http://localhost:11434";
  if (config.ai.baseURL) {
    try {
      const url = new URL(config.ai.baseURL);
      host = `${url.protocol}//${url.host}`;
    } catch (e) {}
  }

  logger.info(`Connecting to Ollama daemon at ${chalk.cyan(host)}...`);

  try {
    const res = await fetch(`${host}/api/tags`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as { models?: any[] };

    if (!data.models || data.models.length === 0) {
      logger.warn(`No models found inside your local Ollama instance.`);
      logger.info(`Try pulling a model first using: ${chalk.yellow("ollama pull llama3")}`);
      return;
    }

    const choices = data.models.map((m: any) => {
      const sizeGB = m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB` : "Unknown size";
      const paramSize = m.details?.parameter_size ? ` [${m.details.parameter_size}]` : "";
      return {
        title: `${chalk.bold(m.name)} ${chalk.dim(`(${sizeGB}${paramSize})`)}`,
        value: m.name,
      };
    });

    const response = await prompts({
      type: "select",
      name: "model",
      message: "Select your active local Ollama model:",
      choices,
      initial: 0,
    });

    if (response.model) {
      config.ai.provider = "ollama";
      config.ai.model = response.model;
      
      // Auto-set standard baseURL if empty or not set to localhost
      if (!config.ai.baseURL || config.ai.baseURL.includes("cloudflare")) {
        config.ai.baseURL = "http://localhost:11434/v1";
      }

      saveConfig(config);

      logger.success(`Configuration updated successfully!`);
      logger.info(`Active Model:   ${chalk.green(response.model)}`);
      logger.info(`AI Provider:    ${chalk.cyan("ollama")}`);
      logger.info(`API Base URL:   ${chalk.cyan(config.ai.baseURL)}`);
    }
  } catch (error: any) {
    logger.error(`Could not connect to Ollama daemon.`);
    console.log(chalk.dim(`\n💡 To solve this, make sure:`));
    console.log(` 1. Ollama is installed on your machine (https://ollama.com).`);
    console.log(` 2. The daemon is running (${chalk.yellow("ollama serve")} or desktop application).`);
    console.log(` 3. Your config baseURL is pointing to your active daemon (current: ${chalk.red(host)}).\n`);
  }
}
