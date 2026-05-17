import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_FILE = path.join(".pika-reports", "cache.json");

export interface CachePayload {
  markdownReports: string[];
  htmlReport: string;
  findings: any[];
}

/**
 * Computes a unique SHA-256 hash representing the current files scan state and custom rules.
 */
export function computeScanHash(files: { filePath: string; content: string }[], rulesContent: string): string {
  const hash = crypto.createHash("sha256");
  
  // Sort files by path to ensure consistent hash ordering
  const sortedFiles = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath));
  for (const file of sortedFiles) {
    hash.update(`file:${file.filePath}\ncontent:${file.content}\n`);
  }
  hash.update(`rules:${rulesContent}`);
  
  return hash.digest("hex");
}

/**
 * Retrieves the cached scan finding results if it exists.
 */
export function getCache(hash: string): CachePayload | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    const json = JSON.parse(data);
    return json[hash] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Caches scan finding results locally inside cache.json.
 */
export function setCache(hash: string, payload: CachePayload): void {
  try {
    let cache: Record<string, CachePayload> = {};
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      cache = JSON.parse(data);
    } else {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    cache[hash] = payload;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    // Fail silently to prevent cache issues from blocking core review execution
  }
}
