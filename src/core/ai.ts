import OpenAI from "openai";
import { ReviewSchema, type CodeReview } from "../utils/schema.js";
import { getConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import path from "path";
import fs from "fs";

/**
 * Structural Extractor: Isolate the JSON object from AI chatter.
 * MoE (Mixture of Experts) models often add preamble or postscript;
 * this ensures we only parse the valid payload even if wrapped in markdown.
 */
export function extractJSON(raw: string): string {
  // Strip common AI "chatter" markers and control characters that break JSON.parse
  let cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      // Keep only safe whitespace: \n, \r, \t
      return ["\n", "\r", "\t"].includes(match) ? match : "";
    });

  // Find the outermost JSON structure
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  // If it's a raw array (starts with [ before {), wrap it
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket !== -1) {
      return `{"reviews": ${cleaned.substring(firstBracket, lastBracket + 1)}}`;
    }
  }

  const start = firstBrace;
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return '{"reviews": []}';
  }

  let snippet = cleaned.substring(start, end + 1);

  // Heuristic: MoE models sometimes miss commas between objects in an array
  snippet = snippet.replace(/\}\s*\{/g, "},{");

  // Heuristic Structural Recovery for Truncated Responses
  const openBraces = (snippet.match(/\{/g) || []).length;
  const closeBraces = (snippet.match(/\}/g) || []).length;
  const openBrackets = (snippet.match(/\[/g) || []).length;
  const closeBrackets = (snippet.match(/\]/g) || []).length;

  // Close in reverse order of nesting (assumes standard structure)
  if (openBrackets > closeBrackets) {
    snippet += "]".repeat(openBrackets - closeBrackets);
  }
  if (openBraces > closeBraces) {
    snippet += "}".repeat(openBraces - closeBraces);
  }

  return snippet;
}

/**
 * Deep Analysis Engine: Communicates with the AI provider.
 * Uses XML-structured prompts for better instruction following in smaller LLMs.
 */
export async function analyzeDiff(diff: string, fileName: string): Promise<CodeReview> {
  const config = getConfig();

  if (!config.ai.apiKey || !config.ai.accountId) {
    throw new Error("Missing AI provider credentials in ~/.pika-review.yaml");
  }

  // Rate Limit Safety: Truncate input to protect the daily free limit.
  // 30,000 chars is roughly 7,500 tokens, leaving room for a detailed response.
  const MAX_CHARS = 30000;
  const safeDiff =
    diff.length > MAX_CHARS
      ? diff.substring(0, MAX_CHARS) +
        "\n... [Content truncated for token safety]"
      : diff;

  const baseURL =
    config.ai.baseURL && config.ai.baseURL.trim()
      ? config.ai.baseURL
      : `https://api.cloudflare.com/client/v4/accounts/${config.ai.accountId}/ai/v1`;

  const openai = new OpenAI({
    apiKey: config.ai.apiKey,
    baseURL,
  });

  // Load custom architecture rules if they exist
  let complianceSection = "";
  try {
    const rulesPath = path.join(process.cwd(), ".pika-rules.md");
    if (fs.existsSync(rulesPath)) {
      complianceSection = `
<compliance_standards>
${fs.readFileSync(rulesPath, "utf-8")}
</compliance_standards>`;
    }
  } catch (e) {}

  const defaultPrompt = `
<role>
  You are an Elite Senior Full-Stack Architect and Security Researcher.
  Your task is to perform a surgical review of the provided code.
</role>${complianceSection}

<context>
  Reviewing File: ${fileName}
</context>

<task>
  Identify high-impact issues related to:
  1. SYSTEM COMPROMISE: Security vulnerabilities, insecure data handling.
  2. COMPUTATIONAL INEFFICIENCY: Algorithmic bottlenecks, memory leaks.
  3. ARCHITECTURAL DEBT: Logic flaws, redundant complexity.
  4. UI/UX ANOMALIES: Layout shifts, accessibility (a11y) violations, and CSS performance issues.
</task>

<instructions>
  - Be language-agnostic but idiom-aware (Polyglot reasoning).
  - Only report issues with clear, tangible impact.
  - Line numbers must be accurate relative to the provided snippet.
  - Return ONLY a JSON object matching the requested schema.
  - ENSURE the JSON is syntactically correct: check all commas, braces, and double-quotes.
  - DO NOT include trailing commas in arrays or objects.
  - BE SUBSTANTIVE: Explain each finding and its impact briefly (2-3 sentences); avoid vague one-liners.
</instructions>

<output_format>
  {
    "reviews": [
      {
        "line": number,
        "severity": "Critical" | "High" | "Medium" | "Low",
        "finding": "A brief explanation of the anomaly and why it is problematic.",
        "impact": "The specific technical or business consequence if left unaddressed.",
        "recommendation": "The specific code correction or refactor."
      }
    ]
  }
</output_format>

<code_to_analyze>
${safeDiff}
</code_to_analyze>
`;

  const finalPrompt =
    config.ai.prompt && config.ai.prompt.trim()
      ? config.ai.prompt.replace("{{code}}", safeDiff)
      : defaultPrompt;

  try {
    const response = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.1, // Low temperature for analytical consistency
      max_tokens: 1500, // Sufficient for multiple architectural findings
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    const cleanedContent = extractJSON(rawContent);

    try {
      const parsedData = JSON.parse(cleanedContent);
      return ReviewSchema.parse(parsedData);
    } catch (e) {
      logger.error(
        `Structural recovery failed. AI returned malformed payload.`,
      );
      logger.dim(`Snippet: ${cleanedContent.substring(0, 100)}...`);
      return { reviews: [] };
    }
  } catch (error: any) {
    if (error.status === 429 || error.status === 4006) {
      const e = new Error("RATE_LIMIT");
      (e as any).status = 429;
      throw e;
    }

    logger.error(`AI analysis failed: ${error.message}`);
    return { reviews: [] };
  }
}
