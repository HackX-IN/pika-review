# Pika Review 🦊
### Enterprise-grade AI Architectural Sentinel

Pika Review is a high-performance CLI tool designed to perform surgical code reviews using AI. It focuses on deep architectural debt, security vulnerabilities, and UI/UX anomalies that traditional linters miss.

**GitHub**: [HackX-IN/pika-review](https://github.com/HackX-IN/pika-review)

---

## 🚀 Key Features
- **Provider Agnostic**: Seamlessly works with Cloudflare Workers AI, OpenAI, Grok, or local LLMs via OpenAI-compatible endpoints.
- **Mixture of Experts (MoE) Reasoning**: Leverages advanced LLMs for deep structural analysis.
- **Polyglot Heuristics**: Idiom-aware reviews across Python, JS/TS, Go, Rust, and React.
- **Interactive UI**: Claude-inspired terminal experience with real-time progress and multi-select discovery.
- **Enterprise-Ready**: Built-in token safety, JSON self-healing, and CI/CD integration.

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
2. Open `~/.pika-review.yaml` and add your Cloudflare credentials:
   ```yaml
   ai:
     accountId: "your-account-id"
     apiKey: "your-scoped-api-token"
   ```

### 🌍 Custom AI Providers (OpenAI, Grok, etc.)
Pika Review works with any OpenAI-compatible API. To use a different provider, simply override the `baseURL` and `model` in your config:

```yaml
ai:
  apiKey: "your-openai-key"
  model: "gpt-4o"
  baseURL: "https://api.openai.com/v1"
```

## 🔍 Usage
Scan staged git changes:
```bash
pika-review scan
```

Scan specific files:
```bash
pika-review scan src/index.ts src/utils/token.ts
```

Scan unstaged changes:
```bash
pika-review scan --unstaged
```

### CI/CD Mode
Use the `--ci` flag in GitHub Actions or other pipelines to fail if Critical or High severity issues are found:
```bash
pika-review scan --ci
```

---

## 🛡️ Privacy & Security
Pika Review uses your local git diffs and sends them directly to your Cloudflare Workers AI instance. No code is stored by Pika Review.

## 📄 License
MIT © Pika Review Contributors
