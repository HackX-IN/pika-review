import fs from "fs";
import path from "path";
import { calculateGrade, getGradeColor, generateBadge } from "./stats.js";

/**
 * Helper to get a sanitized project name.
 */
function getProjectName(): string {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.name) return pkg.name.replace(/\//g, "-");
    }
  } catch (e) {}
  return path.basename(process.cwd());
}

/**
 * Helper to generate a safe filename from a path.
 */
function getSafeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

/**
 * Report Orchestrator: Handles persistence of AI findings in a structured way.
 * Stores reports in .pika-reports/<project-name>/<timestamp>/
 */
export function setupReportDir(): string {
  const rootReportDir = path.join(process.cwd(), ".pika-reports");
  const projectName = getProjectName();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const sessionDir = path.join(rootReportDir, projectName, timestamp);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignore.includes(".pika-reports")) {
      fs.appendFileSync(gitignorePath, "\n.pika-reports/\n");
    }
  }
  return sessionDir;
}

/**
 * Generates a professional Markdown report.
 */
export function writeMarkdownReport(
  fileName: string,
  reviews: any[],
  reportDir: string,
): string {
  const safeName = getSafeFileName(fileName);
  const reportPath = path.join(reportDir, `${safeName}_review.md`);
  const timestamp = new Date().toLocaleString();

  let mdContent = `# 🔍 Pika Review: \`${fileName}\`\n\n`;
  mdContent += `> **Generated on:** ${timestamp}\n`;
  mdContent += `> **Total Issues Found:** ${reviews.length}\n\n`;

  reviews.forEach((issue) => {
    const iconMap = {
      Critical: "🚨",
      High: "🔥",
      Medium: "⚠️",
      Low: "📝",
    };
    const icon = iconMap[issue.severity as keyof typeof iconMap] || "⚠️";

    mdContent += `## ${icon} [${issue.severity}] Line ${issue.line || "N/A"}\n\n`;
    mdContent += `### 💡 Finding\n${issue.finding}\n\n`;
    mdContent += `### 💥 Impact\n${issue.impact}\n\n`;
    mdContent += `### 🛠️ Recommendation\n`;
    
    // Attempt to detect language for syntax highlighting
    const ext = path.extname(fileName).slice(1) || "typescript";
    mdContent += `\`\`\`${ext}\n${issue.recommendation}\n\`\`\`\n\n`;
    mdContent += `---\n\n`;
  });

  fs.writeFileSync(reportPath, mdContent);
  return reportPath;
}



/**
 * Generates a premium Interactive HTML report.
 */
export function writeHTMLReport(
  sessionDir: string,
  totalFiles: number,
  allFindings: { fileName: string; reviews: any[] }[],
): string {
  const reportPath = path.join(sessionDir, `report.html`);
  const projectName = getProjectName();
  const timestamp = new Date().toLocaleString();
  const data = JSON.stringify(allFindings);

  const grade = calculateGrade(allFindings);
  const gradeColor = getGradeColor(grade);
  generateBadge(grade);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pika Sentinel Report | ${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #09090b;
            --sidebar-bg: #0c0c0e;
            --card-bg: rgba(255, 255, 255, 0.02);
            --card-hover: rgba(255, 255, 255, 0.04);
            --text: #f3f4f6;
            --text-dim: #a1a1aa;
            --accent: #00F0FF;
            --accent-glow: rgba(0, 240, 255, 0.15);
            --critical: #ef4444;
            --high: #f97316;
            --medium: #eab308;
            --low: #10b981;
            --border: rgba(255, 255, 255, 0.08);
            --font-sans: 'Outfit', sans-serif;
            --font-mono: 'Fira Code', monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: var(--font-sans); 
            background: var(--bg); 
            color: var(--text);
            display: flex;
            height: 100vh;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* Ambient glows and high-tech grid overlays */
        .bg-grid {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                linear-gradient(to right, rgba(255,255,255,0.01) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px);
            background-size: 30px 30px;
            pointer-events: none;
            z-index: 1;
        }

        .bg-radial {
            position: fixed;
            top: -10%; right: -10%; width: 60vw; height: 60vw;
            background: radial-gradient(circle, rgba(0, 240, 255, 0.03) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1;
        }

        /* Sidebar container */
        aside {
            width: 360px;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            box-shadow: 10px 0 40px rgba(0,0,0,0.5);
            z-index: 10;
        }

        .brand {
            padding: 30px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 16px;
            background: linear-gradient(180deg, rgba(0, 240, 255, 0.02), transparent);
        }

        .brand-logo {
            width: 38px;
            height: 38px;
            filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.5));
        }

        .brand-text h1 { 
            font-size: 1.25rem; 
            font-weight: 800; 
            letter-spacing: -0.5px; 
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .brand-text h1 span {
            color: var(--accent);
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }

        .brand-text p { 
            font-size: 0.75rem; 
            color: var(--text-dim); 
            margin-top: 4px; 
            font-weight: 500; 
        }

        .sidebar-stats {
            padding: 20px 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            border-bottom: 1px solid var(--border);
        }

        .stat-box {
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 12px 6px;
            border-radius: 8px;
            text-align: center;
            transition: all 0.2s ease;
        }

        .stat-box:hover {
            border-color: rgba(255, 255, 255, 0.15);
        }

        .stat-val { 
            display: block; 
            font-size: 1.15rem; 
            font-weight: 800; 
            color: var(--accent); 
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
        }
        
        .stat-box.crit-stat .stat-val {
            color: var(--critical);
            text-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
        }

        .stat-lab { 
            display: block; 
            font-size: 0.6rem; 
            font-weight: 700; 
            text-transform: uppercase; 
            color: var(--text-dim); 
            margin-top: 4px; 
            letter-spacing: 0.05em; 
        }

        .file-list {
            flex: 1;
            overflow-y: auto;
            padding: 20px 16px;
        }

        .file-item {
            padding: 14px 16px;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 8px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .file-item:hover { 
            background: var(--card-hover); 
            border-color: rgba(0, 240, 255, 0.2); 
            transform: translateX(4px);
        }

        .file-item.active { 
            background: rgba(0, 240, 255, 0.04); 
            border-color: var(--accent); 
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.08); 
        }

        .file-item .name { 
            font-size: 0.85rem; 
            font-family: var(--font-mono); 
            font-weight: 500; 
            word-break: break-all;
            color: var(--text-dim);
            transition: color 0.2s;
        }
        
        .file-item.active .name {
            color: var(--accent);
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
        }
        
        .severity-pills { display: flex; gap: 4px; }
        .pill { 
            font-size: 0.65rem; 
            padding: 2px 6px; 
            border-radius: 4px; 
            background: rgba(0,0,0,0.3); 
            font-weight: 700; 
            border: 1px solid rgba(255,255,255,0.05);
        }

        /* Main Content area */
        main {
            flex: 1;
            overflow-y: auto;
            padding: 60px 80px;
            position: relative;
            z-index: 5;
        }

        .content-container { max-width: 900px; margin: 0 auto; }

        .page-header {
            margin-bottom: 40px;
            animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .page-header h2 { 
            font-size: 1.85rem; 
            font-family: var(--font-mono); 
            margin-bottom: 12px; 
            color: #fff;
            letter-spacing: -0.5px;
        }
        
        .page-header p { color: var(--text-dim); font-size: 0.95rem; }

        /* Anomaly Findings Cards */
        .issue-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 24px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .issue-card:hover { 
            transform: translateY(-2px); 
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .card-accent {
            position: absolute;
            left: 0; top: 30px; bottom: 30px;
            width: 4px;
            border-radius: 0 4px 4px 0;
        }

        .issue-card.Critical .card-accent { background: var(--critical); box-shadow: 0 0 15px var(--critical); }
        .issue-card.High .card-accent { background: var(--high); box-shadow: 0 0 15px var(--high); }
        .issue-card.Medium .card-accent { background: var(--medium); box-shadow: 0 0 15px var(--medium); }
        .issue-card.Low .card-accent { background: var(--low); box-shadow: 0 0 15px var(--low); }

        .issue-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }

        .severity-tag {
            font-size: 0.7rem;
            text-transform: uppercase;
            font-weight: 850;
            padding: 4px 12px;
            border-radius: 6px;
            letter-spacing: 0.05em;
        }

        .severity-tag.Critical { background: rgba(239, 68, 68, 0.1); color: var(--critical); border: 1px solid rgba(239, 68, 68, 0.2); }
        .severity-tag.High { background: rgba(249, 115, 22, 0.1); color: var(--high); border: 1px solid rgba(249, 115, 22, 0.2); }
        .severity-tag.Medium { background: rgba(234, 179, 8, 0.1); color: var(--medium); border: 1px solid rgba(234, 179, 8, 0.2); }
        .severity-tag.Low { background: rgba(16, 185, 129, 0.1); color: var(--low); border: 1px solid rgba(16, 185, 129, 0.2); }

        .line-info { font-family: var(--font-mono); color: var(--text-dim); font-size: 0.85rem; }

        .field-group { margin-bottom: 24px; }
        .field-group:last-child { margin-bottom: 0; }
        
        .field-label {
            font-size: 0.7rem;
            font-weight: 800;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .field-content { line-height: 1.6; color: #d1d5db; font-size: 0.95rem; }

        /* Recommendation Pre block with visual copy btn */
        .pre-wrapper {
            position: relative;
            background: #040405;
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 10px;
            margin-top: 10px;
            overflow: hidden;
        }

        .pre-header {
            background: rgba(255,255,255,0.02);
            border-bottom: 1px solid rgba(255,255,255,0.04);
            padding: 6px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .pre-lang {
            font-size: 0.65rem;
            font-weight: 700;
            color: var(--text-dim);
            text-transform: uppercase;
        }

        .card-copy-btn {
            background: none;
            border: 1px solid rgba(255,255,255,0.08);
            color: var(--text-dim);
            font-family: var(--font-sans);
            font-size: 0.65rem;
            font-weight: 600;
            padding: 3px 6px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .card-copy-btn:hover {
            border-color: rgba(0, 240, 255, 0.4);
            color: var(--accent);
        }

        pre {
            padding: 16px;
            font-family: var(--font-mono);
            font-size: 0.85rem;
            line-height: 1.5;
            overflow-x: auto;
            color: #c7d2fe;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
        }

        .empty-state svg { 
            width: 64px; 
            height: 64px; 
            margin-bottom: 20px; 
            stroke: var(--text-dim); 
            opacity: 0.4;
            filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.1));
        }
        
        .empty-state h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .empty-state p {
            font-size: 0.9rem;
            color: var(--text-dim);
            max-width: 320px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--accent); }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-radial"></div>

    <aside>
        <div class="brand">
            <svg viewBox="0 0 100 100" class="brand-logo" fill="none">
              <circle cx="50" cy="50" r="44" stroke="#00F0FF" stroke-width="2" stroke-dasharray="4 8" opacity="0.3" />
              <polygon points="50,42 22,26 34,50" fill="#0c4a6e" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="50,42 78,26 66,50" fill="#0c4a6e" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="50,78 20,48 36,48" fill="#0f172a" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="50,78 80,48 64,48" fill="#0f172a" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="50,42 36,48 50,78" fill="#1e293b" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="50,42 64,48 50,78" fill="#1e293b" stroke="#00F0FF" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="40,52 46,50 44,56" fill="#00F0FF" />
              <polygon points="60,52 54,50 56,56" fill="#00F0FF" />
            </svg>
            <div class="brand-text">
                <h1 style="display: flex; align-items: center; gap: 8px;">Pika <span>Sentinel</span> <span style="font-size: 0.8rem; background: ${gradeColor}; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-shadow: none;">${grade}</span></h1>
                <p>${projectName} • ${timestamp}</p>
            </div>
        </div>
        <div class="sidebar-stats">
            <div class="stat-box">
                <span class="stat-val" id="totalFiles">0</span>
                <span class="stat-lab">Files</span>
            </div>
            <div class="stat-box">
                <span class="stat-val" id="totalIssues">0</span>
                <span class="stat-lab">Issues</span>
            </div>
            <div class="stat-box crit-stat">
                <span class="stat-val" id="criticalIssues">0</span>
                <span class="stat-lab">Critical</span>
            </div>
        </div>
        <div class="file-list" id="fileList"></div>
    </aside>

    <main>
        <div class="content-container" id="mainContent">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h3>Select a file to inspect</h3>
                <p>Architectural anomalies and security compliance findings will appear here.</p>
            </div>
        </div>
    </main>

    <script id="pika-data" type="application/json">${data}</script>
    <script>
        (function() {
            const findings = JSON.parse(document.getElementById('pika-data').textContent);
            const fileList = document.getElementById('fileList');
            const mainContent = document.getElementById('mainContent');
            const totalFilesEl = document.getElementById('totalFiles');
            const totalIssuesEl = document.getElementById('totalIssues');
            const criticalIssuesEl = document.getElementById('criticalIssues');

            function escape(str) {
                if (!str) return '';
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }

            function init() {
                totalFilesEl.textContent = findings.length;
                let issuesCount = 0;
                let criticalCount = 0;
                
                findings.forEach((f, index) => {
                    issuesCount += f.reviews.length;
                    
                    f.reviews.forEach(r => {
                        if (r.severity === 'Critical') {
                            criticalCount++;
                        }
                    });

                    const item = document.createElement('div');
                    item.className = 'file-item';
                    
                    const name = document.createElement('span');
                    name.className = 'name';
                    name.textContent = f.fileName;
                    item.appendChild(name);

                    if (f.reviews.length > 0) {
                        const pills = document.createElement('div');
                        pills.className = 'severity-pills';
                        
                        const counts = f.reviews.reduce((acc, r) => {
                            acc[r.severity] = (acc[r.severity] || 0) + 1;
                            return acc;
                        }, {});

                        Object.entries(counts).forEach(([sev, count]) => {
                            const pill = document.createElement('span');
                            pill.className = 'pill';
                            pill.style.color = 'var(--' + sev.toLowerCase() + ')';
                            pill.textContent = count;
                            pills.appendChild(pill);
                        });
                        item.appendChild(pills);
                    } else {
                        const clean = document.createElement('span');
                        clean.className = 'pill';
                        clean.style.color = 'var(--low)';
                        clean.textContent = 'CLEAN';
                        item.appendChild(clean);
                    }

                    item.onclick = () => selectFile(index, item);
                    fileList.appendChild(item);
                });

                totalIssuesEl.textContent = issuesCount;
                criticalIssuesEl.textContent = criticalCount;
            }

            function selectFile(index, element) {
                document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
                element.classList.add('active');

                const f = findings[index];
                mainContent.innerHTML = '';

                const header = document.createElement('div');
                header.className = 'page-header';
                
                const title = document.createElement('h2');
                title.textContent = f.fileName;
                header.appendChild(title);

                const subtitle = document.createElement('p');
                subtitle.textContent = f.reviews.length + ' findings identified in this analysis.';
                header.appendChild(subtitle);
                
                mainContent.appendChild(header);

                if (f.reviews.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'empty-state';
                    empty.innerHTML = '<h3>✨ Code is pristine</h3><p>No architectural anomalies or security risks found in this file.</p>';
                    mainContent.appendChild(empty);
                    return;
                }

                f.reviews.forEach(r => {
                    const card = document.createElement('div');
                    card.className = 'issue-card ' + r.severity;
                    
                    const escRec = escape(r.recommendation);
                    
                    card.innerHTML = [
                        '<div class="card-accent"></div>',
                        '<div class="issue-meta">',
                            '<span class="severity-tag ' + r.severity + '">' + r.severity + '</span>',
                            '<span class="line-info">Line ' + (r.line || 'N/A') + '</span>',
                        '</div>',
                        '<div class="field-group">',
                            '<div class="field-label">💡 Finding</div>',
                            '<div class="field-content">' + escape(r.finding) + '</div>',
                        '</div>',
                        '<div class="field-group">',
                            '<div class="field-label">💥 Impact</div>',
                            '<div class="field-content">' + escape(r.impact) + '</div>',
                        '</div>',
                        '<div class="field-group">',
                            '<div class="field-label">🛠️ Recommendation</div>',
                            '<div class="pre-wrapper">',
                                '<div class="pre-header">',
                                    '<span class="pre-lang">Code Recommendation</span>',
                                    '<button class="card-copy-btn" onclick="copyRecommendation(this)">Copy Code</button>',
                                '</div>',
                                '<pre><code>' + escRec + '</code></pre>',
                            '</div>',
                        '</div>'
                    ].join('');

                    mainContent.appendChild(card);
                });

                mainContent.scrollTop = 0;
            }

            window.copyRecommendation = function(btn) {
                const preElement = btn.closest('.pre-wrapper').querySelector('pre code');
                const text = preElement ? preElement.textContent : '';

                // Decode HTML entities before copying
                const textarea = document.createElement('textarea');
                textarea.innerHTML = text;
                const decodedText = textarea.value;

                navigator.clipboard.writeText(decodedText).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied! ✓';
                    btn.style.color = 'var(--accent)';
                    btn.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 2000);
                });
            };

            init();
        })();
    </script>
</body>
</html>
`;

  fs.writeFileSync(reportPath, htmlContent);

  // Point 2: Update history.json for stats tracking
  try {
    const historyPath = path.join(process.cwd(), ".pika-reports", "history.json");
    let history: any[] = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    }
    
    const totalIssues = allFindings.reduce((sum, f) => sum + f.reviews.length, 0);
    const severityCounts = allFindings.reduce((acc, f) => {
      f.reviews.forEach(r => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
      });
      return acc;
    }, { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<string, number>);

    history.push({
      timestamp: new Date().toISOString(),
      projectName,
      totalFiles,
      totalIssues,
      severityCounts,
      reportPath: path.relative(path.join(process.cwd(), ".pika-reports"), reportPath)
    });

    // Keep only last 50 runs to prevent file bloat
    if (history.length > 50) history.shift();
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  } catch (e) {}

  return reportPath;
}
