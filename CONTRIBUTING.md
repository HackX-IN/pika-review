# Contributing to Pika Review 🦊

Thank you for your interest in contributing to **Pika Review**, the enterprise-grade AI Architectural Sentinel & Compliance Engine! We are excited to build the future of surgical, offline-first compliance checking alongside the community.

This document provides guidelines and instructions on setting up local development, understanding codebase architecture, and submitting high-quality contributions.

---

## 🏛️ Codebase Architecture

Pika Review is built as a modular TypeScript CLI application. Before you start writing code, it is helpful to understand the directory layout:

```
src/
├── cmd/             # CLI modular subcommands (e.g., init, scan, models, hook, rules)
├── core/            # Core execution logic (scanner engines, AI connection APIs, HTML reporter)
├── utils/           # Shared helper modules (config managers, loggers, token estimators, zod schemas)
└── index.ts         # Main entry point using Commander.js
```

### Key Libraries We Use:
* **CLI Command Management:** [Commander.js](https://github.com/tj/commander.js)
* **Interactive CLI Selection UI:** [prompts](https://github.com/terkelg/prompts)
* **AI Provider Connection:** [OpenAI Node SDK](https://github.com/openai/openai-node) (Ollama, DeepSeek, and Cloudflare also route via OpenAI-compatible endpoints)
* **Console Styling:** [Chalk](https://github.com/chalk/chalk)
* **Terminal Utilities:** `ora` for loaders and `cli-progress` for multi-file scanning bars.

---

## 🛠️ Local Development Setup

We highly recommend using **Bun** for a fast, modern runtime, but standard **Node.js** with NPM is also fully supported.

### 1. Prerequisites
* Install [Bun](https://bun.sh) (v1.3.0+) OR [Node.js](https://nodejs.org) (v20+ / NPM v10+)
* If testing local AI features, install [Ollama](https://ollama.com) and serve it locally (`ollama serve`).

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/HackX-IN/pika-review.git
cd pika-review

# Install dependencies using Bun (Recommended)
bun install

# Or using NPM
npm install
```

### 3. Run in Development Mode
During development, you can run the TypeScript CLI directly without compiling:

```bash
# Using Bun (Instant execution)
bun run src/index.ts scan

# Using NPM (Runs tsx runner)
npx tsx src/index.ts scan
```

### 4. Build and Compile
To compile the TypeScript source into production-grade JavaScript inside the `dist/` folder:

```bash
# Compile TS
bun run build  # or npm run build

# Run the compiled production bundle
node dist/index.js scan
```

---

## ✍️ Coding Standards & Principles

To maintain a clean, high-performance, and secure utility CLI, please adhere to these standards:

### 1. Functional & Async Patterns
* Prefer **Functional Programming** patterns and modular async exports over deep OOP inheritance or class structures.
* Check file size limits and catch exceptions cleanly to avoid crashing the CLI runner when scanning large or binary files.

### 2. Strict Typings
* Ensure all files are 100% strictly typed (0 `any` usage unless absolutely unavoidable).
* Let TypeScript infer types naturally where straightforward, but write interfaces for configuration and schema endpoints explicitly.

### 3. UI/UX CLI Elegance
* **No Clutter:** Avoid logging excessive debugging outputs. Keep console messages concise and highly readable.
* **Curated Color Palettes:** Use `chalk` strategically:
  * `chalk.green` for successes
  * `chalk.cyan`/`chalk.blue` for information updates
  * `chalk.yellow` for warnings and minor anomalies
  * `chalk.red` / `chalk.bgRed` for fatal system crashes
* **Socks/Progress Bars:** Use real-time loaders (`ora` or `cli-progress`) when communicating with external LLM servers so the CLI never feels frozen.

---

## 💡 Adding a New CLI Command

Pika Review makes it extremely straightforward to register and modularize new CLI subcommands:

1. **Create the Action Handler:** Create your command action in `src/cmd/{your-command}.ts`. Export a single async function:
   ```typescript
   import { logger } from "../utils/logger.js";
   
   export async function customAction(options: any) {
     logger.info("Executing custom CLI utility...");
     // Your logic here
   }
   ```
2. **Register Command in Entry Point:** Open `src/index.ts`, import your new handler, and define your command using Commander:
   ```typescript
   import { customAction } from "./cmd/custom.js";
   
   program
     .command("custom")
     .description("A brand-new premium custom command")
     .option("-v, --verbose", "Show verbose debug outputs")
     .action(async (options) => {
       console.log(BRAND);
       await customAction(options);
     });
   ```

---

## 🧪 Testing

We use `bun test` for running our assertion sweeps. Make sure to run all existing tests and add new tests for your features before submitting:

```bash
# Run the test suite
bun test  # or npm test
```

---

## 🚀 Submitting a Pull Request

1. **Create a Branch:** Create a branch with a descriptive, semantic name:
   ```bash
   git checkout -b feat/my-awesome-feature
   # or
   git checkout -b fix/correct-parser-drift
   ```
2. **Verify Compilation:** Compile the project to guarantee there are absolutely zero compiler errors:
   ```bash
   bun run build
   ```
3. **Commit Changes:** Commit with descriptive, clean commit logs (we follow conventional commits: e.g. `feat(cli): add local model selector`).
4. **Push & Open PR:** Push your branch and open a Pull Request against the `main` branch. Provide a clear explanation of what your code changes accomplish, how you verified them, and any new features introduced.

---

Thank you for helping make **Pika Review** the ultimate AI Architectural sentinel! 🦊✨
