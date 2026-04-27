import fs from "fs";
import path from "path";

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pika Review | ${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f1a;
            --sidebar-bg: #151b2d;
            --card-bg: #1e253a;
            --text: #f1f5f9;
            --text-dim: #94a3b8;
            --accent: #38bdf8;
            --critical: #f43f5e;
            --high: #fb923c;
            --medium: #fbbf24;
            --low: #4ade80;
            --border: rgba(255,255,255,0.08);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: var(--bg); 
            color: var(--text);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar */
        aside {
            width: 350px;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            box-shadow: 10px 0 30px rgba(0,0,0,0.3);
            z-index: 10;
        }

        .brand {
            padding: 32px 24px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), transparent);
        }

        .brand h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; color: var(--accent); display: flex; align-items: center; gap: 10px; }
        .brand p { font-size: 0.8rem; color: var(--text-dim); margin-top: 8px; font-weight: 500; }

        .sidebar-stats {
            padding: 20px 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            border-bottom: 1px solid var(--border);
        }

        .stat-box {
            background: rgba(255,255,255,0.03);
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid var(--border);
        }

        .stat-val { display: block; font-size: 1.25rem; font-weight: 700; color: var(--accent); }
        .stat-lab { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-dim); margin-top: 4px; letter-spacing: 0.05em; }

        .file-list {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .file-item {
            padding: 14px 16px;
            border-radius: 12px;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            gap: 6px;
            border: 1px solid transparent;
        }

        .file-item:hover { background: rgba(255,255,255,0.04); border-color: var(--border); }
        .file-item.active { background: var(--accent); color: #000; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); }
        .file-item .name { font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; font-weight: 500; word-break: break-all; }
        
        .severity-pills { display: flex; gap: 4px; }
        .pill { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.2); font-weight: 700; }
        .file-item.active .pill { background: rgba(0,0,0,0.1); color: #000; }

        /* Main Content */
        main {
            flex: 1;
            overflow-y: auto;
            padding: 60px;
            background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.05), transparent 40%);
        }

        .content-container { max-width: 900px; margin: 0 auto; }

        .page-header {
            margin-bottom: 50px;
            animation: fadeInDown 0.5s ease-out;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .page-header h2 { font-size: 2rem; font-family: 'JetBrains Mono', monospace; margin-bottom: 12px; color: #fff; }
        .page-header p { color: var(--text-dim); font-size: 1rem; }

        .issue-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 32px;
            margin-bottom: 30px;
            position: relative;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }

        .issue-card:hover { transform: translateY(-4px); }

        .card-accent {
            position: absolute;
            left: 0; top: 32px; bottom: 32px;
            width: 5px;
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
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 8px;
            letter-spacing: 0.05em;
        }

        .severity-tag.Critical { background: rgba(244, 63, 94, 0.15); color: var(--critical); border: 1px solid var(--critical); }
        .severity-tag.High { background: rgba(251, 146, 60, 0.15); color: var(--high); border: 1px solid var(--high); }
        .severity-tag.Medium { background: rgba(251, 191, 36, 0.15); color: var(--medium); border: 1px solid var(--medium); }
        .severity-tag.Low { background: rgba(74, 222, 128, 0.15); color: var(--low); border: 1px solid var(--low); }

        .line-info { font-family: 'JetBrains Mono', monospace; color: var(--text-dim); font-size: 0.9rem; }

        .field-group { margin-bottom: 24px; }
        .field-label {
            font-size: 0.7rem;
            font-weight: 800;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .field-content { line-height: 1.7; color: #cbd5e1; font-size: 1.05rem; }

        pre {
            background: #000;
            padding: 24px;
            border-radius: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            margin-top: 15px;
            overflow-x: auto;
            border: 1px solid rgba(255,255,255,0.05);
            color: #e2e8f0;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            opacity: 0.6;
        }

        .empty-state svg { width: 80px; height: 80px; margin-bottom: 24px; stroke: var(--text-dim); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--accent); }
    </style>
</head>
<body>
    <aside>
        <div class="brand">
            <h1>🦊 PIKA REVIEW</h1>
            <p>${projectName} • ${timestamp}</p>
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
        </div>
        <div class="file-list" id="fileList"></div>
    </aside>

    <main>
        <div class="content-container" id="mainContent">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h3>Select a file to inspect</h3>
                <p>Architectural findings and security insights will appear here.</p>
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

            function escape(str) {
                if (!str) return '';
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }

            function init() {
                totalFilesEl.textContent = findings.length;
                let issuesCount = 0;
                
                findings.forEach((f, index) => {
                    issuesCount += f.reviews.length;
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
                            '<pre><code>' + escape(r.recommendation) + '</code></pre>',
                        '</div>'
                    ].join('');

                    mainContent.appendChild(card);
                });

                mainContent.scrollTop = 0;
            }

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
