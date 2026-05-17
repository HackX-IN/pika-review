# Pika Review 🦊

### Enterprise-grade AI Architectural Sentinel & Compliance Engine

Pika Review is a high-performance CLI tool designed to perform surgical code reviews using AI. It focuses on deep architectural debt, security vulnerabilities, and project-specific compliance that traditional linters miss.

**GitHub**: [HackX-IN/pika-review](https://github.com/HackX-IN/pika-review)

---

## 🚀 Key Features

- **🧠 Architecture Rules Engine**: Enforce project-specific standards via `.pika-rules.md`.
- **🦙 Native Local Ollama Support**: Run 100% private, free, offline scans using local LLMs (e.g. Qwen, Llama).
- **🎛️ Local Model Selector**: Interactively choose and configure local models from the command line.
- **🛡️ Git Commit Safeguard Hook**: Prevent pushing high-severity compliance debt and vulnerabilities automatically.
- **📊 Health Dashboard**: Track architectural health trends over time with `pika-review stats`.
- **🎨 Premium Interactive Reports**: Immersive, dark-mode HTML reports for deep triage.
- **🔍 Smart Context Scanning**: Uses `-U10` context windows for higher AI reasoning accuracy.
- **🛡️ "Pika-Ignore" support**: Suppress specific lines using `// pika-ignore` comments.
- **⚡ Parallel Orchestration**: Scans multiple files concurrently with `p-limit`.
- **🌍 Provider Agnostic**: Works with OpenAI, Claude, Grok, local Ollama, or any OpenAI-compatible endpoint.

---

## 📦 Installation

```bash
# Via Bun (Recommended)
bun add -g pika-review

# Via NPM
npm install -g pika-review
```

## 🛠️ Setup

1. Initialize your configuration:
   ```bash
   pika-review init
   ```
2. Configure your AI provider in `~/.pika-review.yaml`:
   ```yaml
   ai:
     apiKey: "your-api-token"
     model: "gpt-4o" # or your preferred model
     baseURL: "https://api.openai.com/v1"
   ```

---

## 🏗️ Enterprise Features

### 1. Architecture Rules Engine

Create a `.pika-rules.md` file in your repository root to guide the AI with project-specific context:

```markdown
# Architectural Rules

- Use Functional Components with Hooks, never Class Components.
- All service calls must go through `src/api/client.ts`.
- Database queries are restricted to the Repository layer.
```

### 2. Pika-Ignore

Suppress false positives or acknowledged risks directly in your code:

```typescript
const secret = "12345"; // pika-ignore (intentional for testing)
```

### 3. Health Stats

Monitor your codebase's architectural debt over time:

```bash
pika-review stats
```

---

## 🔍 Usage

| Command                 | Description                                                  |
| :---------------------- | :----------------------------------------------------------- |
| `pika-review scan`      | Scan staged git changes (Default)                            |
| `pika-review scan -i`   | Interactive file selection mode                              |
| `pika-review view`      | Open the latest interactive report                           |
| `pika-review stats`     | View architectural health trends and scan dashboard          |
| `pika-review models`    | Interactively select and configure local Ollama models       |
| `pika-review hook <act>`| Install (`install`) or uninstall (`uninstall`) Git safeguards |
| `pika-review rules -g`  | Auto-generate architectural `.pika-rules.md` guidelines       |
| `pika-review scan --ci` | Fail pipeline on Critical/High issues                        |

---

## 🦙 Local Ollama & Offline Setup

Pika Review fully supports local, 100% private, offline code reviews via [Ollama](https://ollama.com).

### 1. Configure Ollama Provider
Initialize your configuration:
```bash
pika-review init
```
Open `~/.pika-review.yaml` and configure the Ollama provider:
```yaml
ai:
  provider: "ollama"
  model: "qwen2.5-coder:7b" # Or your pulled model
  baseURL: "http://localhost:11434/v1"
```

### 2. Interactive Local Setup
To avoid editing files manually, you can manage everything directly from the command line:

```bash
# Discover local pulled models and switch active model instantly
pika-review models

# Automatically bootstrap customized architectural rules for your tech stack
pika-review rules --generate

# Register git safeguard hooks to run scans automatically before commits
pika-review hook install
```

---

## 🤝 Contributing

We welcome contributions from the community to help make Pika Review the ultimate architectural code reviewer! 

Please read our **[Contributing Guide](CONTRIBUTING.md)** for details on how to set up local development, run compiler checks, write custom CLI commands, and submit high-quality Pull Requests.

---

## 🛡️ Privacy & Security

Pika Review processes your local git diffs and transmits them directly to your configured AI provider via SSL. No code is stored or cached by the Pika Review engine.

## 📄 License

MIT © Pika Review Contributors
