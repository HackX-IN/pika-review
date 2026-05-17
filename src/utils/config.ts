import fs from "fs";
import path from "path";
import os from "os";
import yaml from "yaml";
import { logger } from "./logger.js";

const CONFIG_PATH = path.join(os.homedir(), ".pika-review.yaml");

export interface PikaConfig {
  ai: {
    provider?: string;
    accountId?: string;
    apiKey?: string;
    model: string;
    prompt?: string;
    baseURL?: string;
  };
}

const DEFAULT_CONFIG: PikaConfig = {
  ai: {
    provider: "openai",
    accountId: "", // Account ID if required (e.g. Cloudflare)
    apiKey: "",
    model: "gpt-4o",
    prompt: "",
    baseURL: "https://api.openai.com/v1", // Default OpenAI endpoint
  },
};

/**
 * Initialize global configuration with restrictive permissions.
 * We use 0o600 because this file contains sensitive API keys.
 */
export function initConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, yaml.stringify(DEFAULT_CONFIG), {
      mode: 0o600,
    });
    logger.success(`Configuration initialized at ${CONFIG_PATH}`);
    logger.info("Please edit this file and add your AI provider credentials.");
  } else {
    logger.warn(`Configuration already exists at ${CONFIG_PATH}`);
  }
}

/**
 * Retrieve configuration, failing fast if not found.
 */
export function getConfig(): PikaConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    logger.error("Configuration not found. Run 'pika-review init' first.");
    process.exit(1);
  }
  return yaml.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

/**
 * Save configuration back to disk with correct permissions.
 */
export function saveConfig(config: PikaConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, yaml.stringify(config), {
      mode: 0o600,
    });
  } catch (error: any) {
    logger.error(`Failed to save configuration: ${error.message}`);
  }
}

/**
 * Get files to ignore during scanning.
 */
export function getIgnoredFiles(): string[] {
  const ignorePath = path.join(process.cwd(), ".pikaignore");
  if (!fs.existsSync(ignorePath)) {
    return [
      ".svg",
      ".lock",
      "package-lock.json",
      ".png",
      ".jpg",
      ".jpeg",
      ".ico",
      "node_modules",
      ".git",
      "dist",
      "build",
      "out",
      ".next",
      "public",
      ".pika-reports",
      ".env",
      ".DS_Store",
      "bun.lockb",
      "pnpm-lock.yaml",
      "venv",
      ".venv",
      "__pycache__",
      ".pytest_cache",
      "target",
      ".gradle",
      ".idea",
      ".vscode",
      "vendor",
      "coverage",
      ".turbo",
      "tests",
      "__tests__",
      "spec",
      "specs",
      "cypress",
      "playwright-report",
      "test-results",
      ".nyc_output",
    ];
  }
  const content = fs.readFileSync(ignorePath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
