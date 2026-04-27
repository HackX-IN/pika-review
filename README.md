# Pika Review 🦊

### Enterprise-grade AI Architectural Sentinel & Compliance Engine

Pika Review is a high-performance CLI tool designed to perform surgical code reviews using AI. It focuses on deep architectural debt, security vulnerabilities, and project-specific compliance that traditional linters miss.

**GitHub**: [HackX-IN/pika-review](https://github.com/HackX-IN/pika-review)

---

## 🚀 Key Features

- **🧠 Architecture Rules Engine**: Enforce project-specific standards via `.pika-rules.md`.
- **📊 Health Dashboard**: Track architectural health trends over time with `pika-review stats`.
- **🎨 Premium Interactive Reports**: Immersive, dark-mode HTML reports for deep triage.
- **🔍 Smart Context Scanning**: Uses `-U10` context windows for higher AI reasoning accuracy.
- **🛡️ "Pika-Ignore" support**: Suppress specific lines using `// pika-ignore` comments.
- **⚡ Parallel Orchestration**: Scans multiple files concurrently with `p-limit`.
- **🌍 Provider Agnostic**: Works with OpenAI, Claude, Grok, or any OpenAI-compatible endpoint.

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

| Command                 | Description                           |
| :---------------------- | :------------------------------------ |
| `pika-review scan`      | Scan staged git changes (Default)     |
| `pika-review scan -i`   | Interactive file selection mode       |
| `pika-review view`      | Open the latest interactive report    |
| `pika-review stats`     | View architectural health dashboard   |
| `pika-review scan --ci` | Fail pipeline on Critical/High issues |

---

## 🛡️ Privacy & Security

Pika Review processes your local git diffs and transmits them directly to your configured AI provider via SSL. No code is stored or cached by the Pika Review engine.

## 📄 License

MIT © Pika Review Contributors
