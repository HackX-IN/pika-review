import fs from "fs";
import path from "path";

const BADGE_FILE = path.join(process.cwd(), "badge.svg");

export type SentinelGrade = "A+" | "A" | "B" | "C" | "F";

/**
 * Computes the architectural grade based on the severities of identified findings.
 */
export function calculateGrade(findings: any[]): SentinelGrade {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  findings.forEach((f: any) => {
    f.reviews.forEach((r: any) => {
      const severity = r.severity;
      if (severity === "Critical") criticalCount++;
      else if (severity === "High") highCount++;
      else if (severity === "Medium") mediumCount++;
    });
  });

  if (criticalCount >= 2) return "F";
  if (criticalCount === 1) return "C";
  if (highCount >= 3) return "C";
  if (highCount >= 1 || mediumCount >= 4) return "B";
  if (mediumCount >= 1) return "A";
  return "A+";
}

/**
 * Retrieves the HSL color code corresponding to a Sentinel Grade.
 */
export function getGradeColor(grade: SentinelGrade): string {
  switch (grade) {
    case "A+": return "#00F0FF"; // Neon Cyan
    case "A": return "#10B981";  // Emerald Green
    case "B": return "#3B82F6";  // Royal Blue
    case "C": return "#F59E0B";  // Amber Yellow
    case "F": return "#EF4444";  // Ruby Red
  }
}

/**
 * Renders and saves a beautiful, high-quality, scalable SVG badge displaying the current Pika grade.
 */
export function generateBadge(grade: SentinelGrade): void {
  const color = getGradeColor(grade);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20" role="img" aria-label="Pika Sentinel: Grade ${grade}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="140" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="90" height="20" fill="#2d3748"/>
    <rect x="90" width="50" height="20" fill="${color}"/>
    <rect width="140" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="110">
    <text aria-hidden="true" x="460" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="700">Pika Sentinel</text>
    <text x="460" y="140" transform="scale(.1)" fill="#fff" textLength="700">Pika Sentinel</text>
    <text aria-hidden="true" x="1150" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="300">${grade}</text>
    <text x="1150" y="140" transform="scale(.1)" fill="#fff" textLength="300">${grade}</text>
  </g>
</svg>`;

  try {
    const dir = path.dirname(BADGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BADGE_FILE, svg, "utf-8");
  } catch (e) {
    // Fail silently to keep stats errors isolated from blocking CLI scan operations
  }
}
