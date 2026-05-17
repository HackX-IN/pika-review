document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Mobile Menu Drawer Toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
      menuToggle.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggle) {
        sidebar.classList.remove('open');
        menuToggle.textContent = '☰';
      }
    });
  }

  // 2. Package Manager Tab Switcher
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update panes
      tabPanes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // 3. Subcommands Accordion
  const accordionTriggers = document.querySelectorAll('.cmd-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      
      // Close other accordions
      document.querySelectorAll('.cmd-item').forEach(item => {
        if (item !== parent) {
          item.classList.remove('active');
        }
      });
      
      // Toggle current
      parent.classList.toggle('active');
    });
  });

  // 4. Sidebar Search Filter
  const searchInput = document.getElementById('searchInput');
  const navLinks = document.querySelectorAll('.sidebar-nav-links li');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase().trim();
      
      navLinks.forEach(li => {
        const text = li.textContent.toLowerCase();
        if (text.includes(filter)) {
          li.style.display = 'block';
        } else {
          li.style.display = 'none';
        }
      });
      
      // Hide sections if all their children are hidden
      document.querySelectorAll('nav').forEach(nav => {
        const sections = nav.querySelectorAll('.sidebar-nav-title');
        sections.forEach(sec => {
          const siblingList = sec.nextElementSibling;
          if (siblingList && siblingList.tagName === 'UL') {
            const visibleItems = siblingList.querySelectorAll('li[style="display: block;"], li:not([style*="display: none"])');
            sec.style.display = visibleItems.length === 0 ? 'none' : 'block';
          }
        });
      });
    });
  }

  // 5. Scroll Spy (Active Headings Highlighting in TOC / Sidebar)
  const sections = document.querySelectorAll('section[id]');
  const tocLinks = document.querySelectorAll('.toc-links a');
  const sidebarLinks = document.querySelectorAll('.sidebar-nav-links a');

  const spyOptions = {
    root: null,
    rootMargin: '-10% 0px -70% 0px',
    threshold: 0
  };

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        // Update Table of Contents
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        // Update Sidebar
        sidebarLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, spyOptions);

  sections.forEach(sec => spyObserver.observe(sec));

  // 6. Premium Immersive CLI Terminal Simulation
  const terminalBody = document.getElementById('terminalBody');
  const simulationCode = 'pika-review scan';
  let cursorEl = null;

  async function startTerminalSimulation() {
    terminalBody.innerHTML = `<span class="terminal-prompt">dev@pika-review:~$ </span><span class="terminal-input" id="terminalInput"><span class="cursor"></span></span>`;
    const inputContainer = document.getElementById('terminalInput');
    cursorEl = inputContainer.querySelector('.cursor');
    
    // Typing delay helper
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Simulated Typing
    for (let i = 0; i < simulationCode.length; i++) {
      await delay(80 + Math.random() * 60);
      const charSpan = document.createElement('span');
      charSpan.textContent = simulationCode[i];
      inputContainer.insertBefore(charSpan, cursorEl);
    }
    
    await delay(600); // Hold before executing
    
    // Remove active typing cursor for outputs
    if (cursorEl) cursorEl.style.display = 'none';
    
    // Step 2: Outputs execution initial
    appendTerminalLine(`<br>🔍 Scanning staged files in current workspace (3 files)...`);
    await delay(800);
    
    // Step 3: Interactive Progress Bar loop
    const progressBarId = 'cliProgress';
    const progressTextId = 'cliProgressText';
    appendTerminalLine(`  <div class="cli-bar-outer"><div class="cli-bar-inner" id="${progressBarId}"></div></div> <span id="${progressTextId}">0%</span> scanning...`);
    
    const progressBar = document.getElementById(progressBarId);
    const progressText = document.getElementById(progressTextId);
    
    for (let p = 0; p <= 100; p += 10) {
      await delay(120);
      if (progressBar) progressBar.style.width = `${p}%`;
      if (progressText) progressText.textContent = `${p}%`;
    }
    
    await delay(300);
    appendTerminalLine(`<br>📊 Analyzing stage completed. Compiling checklist...<br>`);
    await delay(600);
    
    // Step 4: Display file check results
    appendTerminalLine(`  📄 src/utils/config.ts  <span style="color: #10b981; font-weight: bold;">PASS</span>`);
    await delay(400);
    appendTerminalLine(`  📄 src/core/scanner.ts  <span style="color: #10b981; font-weight: bold;">PASS</span>`);
    await delay(400);
    appendTerminalLine(`  📄 src/core/ai.ts       <span style="color: #ef4444; font-weight: bold;">FAIL</span> (Architectural Anomaly Discovered!)`);
    await delay(600);
    
    // Step 5: Inject visual anomaly finding card
    const findingHtml = `
      <div class="finding-box">
        <div style="margin-bottom: 6px; font-weight: bold; display: flex; align-items: center;">
          <span class="finding-crit">Critical</span>
          <span style="color: #ef4444;">Hardcoded Credentials / Security Breach</span>
        </div>
        <div style="color: #a5b4fc; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 8px;">
          Line 24: const apiKey = "sk-proj-5X9a7D...";
        </div>
        <div style="color: #94a3b8; font-size: 0.8rem; line-height: 1.4;">
          <strong>Rule Violation:</strong> Never commit raw API keys or connection tokens to the repository.<br>
          <strong>Architect Recommendation:</strong> Remove the hardcoded string and load credentials dynamically from environment variables (e.g. <code>process.env.OPENAI_API_KEY</code>).
        </div>
      </div>
    `;
    appendTerminalLine(findingHtml);
    await delay(1000);
    
    // Step 6: Halt and exit code alert
    appendTerminalLine(`<br><span style="color: #ef4444; font-weight: bold;">❌ [PIKA SHIELD] Scan failed. 1 Critical issue block found. Commit aborted.</span>`);
    appendTerminalLine(`<span class="terminal-prompt">dev@pika-review:~$ </span><span class="cursor"></span>`);
    
    // Hold 6 seconds before looping
    await delay(6000);
    startTerminalSimulation();
  }

  function appendTerminalLine(htmlContent) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = htmlContent;
    terminalBody.appendChild(line);
    
    // Auto-scroll terminal
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // Kick off CLI simulation loop
  startTerminalSimulation();
});

// 7. Clipboard Copy Helper
window.copyCode = function(elementId) {
  const codeText = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(codeText).then(() => {
    // Show feedback
    const btn = document.querySelector(`[onclick="copyCode('${elementId}')"]`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Copied! ✓';
      btn.style.borderColor = 'hsl(var(--accent))';
      btn.style.color = 'hsl(var(--accent))';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.borderColor = 'hsl(var(--border))';
        btn.style.color = 'hsl(var(--text-secondary))';
      }, 2000);
    }
  }).catch(err => {
    console.error('Clipboard copy failed: ', err);
  });
};
