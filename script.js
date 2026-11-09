document.documentElement.classList.add('js');
requestAnimationFrame(() => {
  document.documentElement.classList.add('is-loaded');
});

document.addEventListener('DOMContentLoaded', () => {
  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Dark / Light Theme Toggle
  initThemeToggle();

  // Reading progress bar
  initReadingProgress();

  // Mobile navigation toggle
  initMobileNav();

  // Header elevation & blur transition on scroll
  initHeaderScroll();

  // Command palette & site search (Cmd+K)
  initCommandPalette();

  // Interactive Tools & Calculators (if on tool pages)
  initCalculators();

  // Assessment diagnostic (if on readiness tool page)
  initAssessment();

  // Social share copy and code copy buttons
  initCopyButtons();

  // Accessible interactive tabs (e.g. First 90 Days Playbook)
  initTabs();

  // Table of Contents active spy
  initTocSpy();

  // Interactive SVG architecture diagram nodes
  initInteractiveDiagrams();

  // Living AI Pipeline Playground Simulator (Zajno-inspired)
  initPipelineSimulator();

  // Editorial scroll ingress
  initScrollReveal();

  // Ambient cursor spotlight on cards
  initCursorSpotlight();

  // Kinetic typography headline reveal
  initKineticTypography();

  // Living Hero Motion Canvas Stream (Zajno-inspired)
  initHeroMotionCanvas();

  // Lenis inertia smooth scroll
  initSmoothScroll();
});

/* Mobile Nav */
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (!navToggle || !mainNav) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    mainNav.classList.toggle('is-open', !isOpen);
    const sr = navToggle.querySelector('.sr-only');
    if (sr) sr.textContent = isOpen ? 'Open navigation' : 'Close navigation';
  });

  mainNav.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      navToggle.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
      navToggle.focus();
    }
  });
}

/* Command Palette (Cmd+K / Ctrl+K) */
function initCommandPalette() {
  const searchTriggers = document.querySelectorAll('.search-trigger, [data-open-palette]');
  const modal = document.getElementById('command-palette-modal');
  if (!modal) return;

  const input = modal.querySelector('.palette-input');
  const resultsContainer = modal.querySelector('.palette-results');
  const closeBtn = modal.querySelector('[data-close-palette]');

  const searchIndex = [
    { title: "Enterprise Model Context Protocol (MCP) Architecture", url: "/architectures/enterprise-mcp-gateway/", category: "Architecture" },
    { title: "GraphRAG & Knowledge Graph Context Engine", url: "/architectures/graph-rag-knowledge-engine/", category: "Architecture" },
    { title: "Why 95% of Enterprise AI Pilots Fail at the Perimeter", url: "/insights/why-95-percent-of-enterprise-ai-pilots-fail-at-the-perimeter/", category: "Insight" },
    { title: "The Multi-Model Router: Slashing Inference Spend by 78%", url: "/insights/enterprise-model-routing-and-slm-distillation/", category: "Insight" },
    { title: "Graph Engineering Platform: Obsidian Agent Skills & MCP Servers", url: "/tools/graph-engineering/", category: "Platform" },
    { title: "Enterprise AI Production Readiness Framework", url: "/frameworks/enterprise-ai-production-readiness/", category: "Framework" },
    { title: "Enterprise RAG Architecture Blueprint", url: "/architectures/enterprise-rag/", category: "Architecture" },
    { title: "Agentic RAG Architecture", url: "/architectures/agentic-rag/", category: "Architecture" },
    { title: "Enterprise AI Gateway Architecture", url: "/architectures/enterprise-ai-gateway/", category: "Architecture" },
    { title: "Secure Enterprise AI Architecture", url: "/architectures/secure-enterprise-ai/", category: "Architecture" },
    { title: "Production LLM Observability Stack", url: "/architectures/llm-observability/", category: "Architecture" },
    { title: "AI-Powered Enterprise SDLC Architecture", url: "/architectures/ai-powered-sdlc/", category: "Architecture" },
    { title: "The Enterprise AI Engineering Handbook", url: "/enterprise-ai-engineering/", category: "Handbook" },
    { title: "Enterprise AI Radar (ADOPT / TRIAL / ASSESS / WATCH)", url: "/ai-radar/", category: "Radar" },
    { title: "Enterprise AI Readiness Assessment Tool", url: "/tools/enterprise-ai-readiness/", category: "Tool" },
    { title: "RAG Cost Calculator", url: "/tools/rag-cost-calculator/", category: "Tool" },
    { title: "LLM Token Cost Calculator", url: "/tools/llm-cost-calculator/", category: "Tool" },
    { title: "AI Use Case Prioritiser Matrix", url: "/tools/ai-use-case-prioritiser/", category: "Tool" },
    { title: "Build vs Buy AI Platform Calculator", url: "/tools/build-vs-buy-ai-platform/", category: "Tool" },
    { title: "The 5-Stage Framework for Taking Enterprise AI to Production", url: "/insights/the-5-stage-framework-for-taking-enterprise-ai-to-production/", category: "Insight" },
    { title: "Why Hybrid RAG Beats Pure Vector Search in Enterprise Settings", url: "/insights/why-hybrid-rag-beats-pure-vector-search-in-enterprise-settings/", category: "Insight" },
    { title: "The Hidden Costs of LLM Inference: A Cost Modeling Guide", url: "/insights/the-hidden-costs-of-llm-inference-a-cost-modeling-guide/", category: "Insight" },
    { title: "Enterprise AI Engineering: From Experimentation to Production", url: "/insights/enterprise-ai-engineering-production-playbook/", category: "Insight" },
    { title: "Why Enterprise AI Agents Fail After the Demo", url: "/insights/why-enterprise-ai-agents-fail-after-the-demo/", category: "Insight" },
    { title: "Enterprise RAG Architecture: A Production Blueprint", url: "/insights/enterprise-rag-production-blueprint/", category: "Insight" },
    { title: "RAG vs Agentic RAG: Enterprise Decision Guide", url: "/insights/rag-vs-agentic-rag-enterprise-decision-guide/", category: "Insight" },
    { title: "AI Code Review Agents in the Enterprise SDLC", url: "/insights/ai-code-review-agent-engineering-sdlc/", category: "Insight" },
    { title: "Enterprise AI Governance Without Killing Innovation", url: "/insights/enterprise-ai-governance-without-killing-innovation/", category: "Insight" },
    { title: "Best RAG Frameworks for Enterprise 2026", url: "/compare/rag-frameworks/", category: "Comparison" },
    { title: "Vector Databases Compared: Pinecone vs Weaviate vs pgvector", url: "/compare/vector-databases/", category: "Comparison" },
    { title: "LangChain vs LlamaIndex vs Haystack for Enterprise AI", url: "/compare/llm-orchestration/", category: "Comparison" },
    { title: "Architectural Comparisons Hub", url: "/compare/", category: "Comparison" },
    { title: "Speaking & Keynotes", url: "/speaking/", category: "Speaking" },
    { title: "The Enterprise AI Brief Archive", url: "/brief/", category: "Newsletter" },
    { title: "Enterprise AI Research Hub", url: "/research/", category: "Research" },
    { title: "About Bhavin Mistry", url: "/about/", category: "About" },
    { title: "Enterprise AI Brief (Newsletter)", url: "/newsletter/", category: "Newsletter" },
    { title: "Toggle Theme (Dark / Light Mode)", url: "#action-toggle-theme", category: "Action" }
  ];

  function openPalette() {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    if (input) {
      input.value = '';
      input.focus();
      renderResults(searchIndex.slice(0, 7));
    }
  }

  function closePalette() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderResults(items) {
    if (!resultsContainer) return;
    if (items.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--muted); font-size: 13px;">No resources found. Try another query.</div>';
      return;
    }
    resultsContainer.innerHTML = items.map(item => `
      <a href="${item.url}" class="palette-item">
        <span>${item.title}</span>
        <span class="badge badge-accent">${item.category}</span>
      </a>
    `).join('');
  }

  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.palette-item');
      if (!item) return;
      const href = item.getAttribute('href');
      if (href === '#action-toggle-theme') {
        e.preventDefault();
        closePalette();
        const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('bm-theme', next); } catch(err) {}
        showToast(next === 'dark' ? 'Executive Midnight Mode 🌙' : 'Editorial Light Mode ☀️');
      }
    });
  }

  searchTriggers.forEach(trigger => trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openPalette();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closePalette);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePalette();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      modal.classList.contains('is-active') ? closePalette() : openPalette();
    }
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closePalette();
    }
  });

  if (input) {
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        renderResults(searchIndex.slice(0, 7));
        return;
      }
      const matches = searchIndex.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
      renderResults(matches);
    });
  }
}

/* Output update helper with tactile animation */
function setAnimatedOutput(id, newValue) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== newValue) {
    el.textContent = newValue;
    el.classList.remove('num-updated');
    void el.offsetWidth;
    el.classList.add('num-updated');
  }
}

/* Calculators & Decision Tools */
function initCalculators() {
  // 1. LLM Cost Calculator
  const llmForm = document.getElementById('llm-calculator-form');
  if (llmForm) {
    const calc = () => {
      const requests = parseFloat(document.getElementById('llm-requests').value) || 0;
      const inputTokens = parseFloat(document.getElementById('llm-input-tokens').value) || 0;
      const outputTokens = parseFloat(document.getElementById('llm-output-tokens').value) || 0;
      const inputPricePerM = parseFloat(document.getElementById('llm-input-price').value) || 0;
      const outputPricePerM = parseFloat(document.getElementById('llm-output-price').value) || 0;
      const cacheHitPercent = (parseFloat(document.getElementById('llm-cache-hit').value) || 0) / 100;
      const daysPerMonth = parseFloat(document.getElementById('llm-days-month').value) || 30;

      // Uncached vs Cached input
      const effectiveInputTokens = inputTokens * (1 - cacheHitPercent * 0.75); // 75% savings on cache hit
      const costPerRequest = ((effectiveInputTokens / 1_000_000) * inputPricePerM) + ((outputTokens / 1_000_000) * outputPricePerM);
      const dailyCost = costPerRequest * requests;
      const monthlyCost = dailyCost * daysPerMonth;
      const annualCost = monthlyCost * 12;

      setAnimatedOutput('out-cost-request', `$${costPerRequest.toFixed(4)}`);
      setAnimatedOutput('out-cost-day', `$${dailyCost.toFixed(2)}`);
      setAnimatedOutput('out-cost-month', `$${monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-cost-annual', `$${annualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    };
    llmForm.addEventListener('input', calc);
    calc();
  }

  // 2. RAG Cost Calculator
  const ragForm = document.getElementById('rag-calculator-form');
  if (ragForm) {
    const calcRAG = () => {
      const monthlyQueries = parseFloat(document.getElementById('rag-queries').value) || 0;
      const avgInputTokens = parseFloat(document.getElementById('rag-input-tokens').value) || 0;
      const avgOutputTokens = parseFloat(document.getElementById('rag-output-tokens').value) || 0;
      const retrievedChunks = parseFloat(document.getElementById('rag-chunks').value) || 5;
      const chunkTokens = parseFloat(document.getElementById('rag-chunk-tokens').value) || 500;
      const inputPricePerM = parseFloat(document.getElementById('rag-llm-input-price').value) || 3.0;
      const outputPricePerM = parseFloat(document.getElementById('rag-llm-output-price').value) || 15.0;
      const embedPricePerM = parseFloat(document.getElementById('rag-embed-price').value) || 0.02;
      const cacheRate = (parseFloat(document.getElementById('rag-cache-rate').value) || 0) / 100;

      const totalContextTokens = avgInputTokens + (retrievedChunks * chunkTokens);
      const effectiveContextTokens = totalContextTokens * (1 - cacheRate * 0.8);
      
      const llmInputCost = (monthlyQueries * effectiveContextTokens / 1_000_000) * inputPricePerM;
      const llmOutputCost = (monthlyQueries * avgOutputTokens / 1_000_000) * outputPricePerM;
      const embeddingCost = (monthlyQueries * avgInputTokens / 1_000_000) * embedPricePerM;
      const monthlyTotal = llmInputCost + llmOutputCost + embeddingCost;
      const costPerQuery = monthlyQueries > 0 ? (monthlyTotal / monthlyQueries) : 0;
      const cachingSavings = (monthlyQueries * totalContextTokens * 0.8 * cacheRate / 1_000_000) * inputPricePerM;

      setAnimatedOutput('out-rag-month', `$${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-rag-query', `$${costPerQuery.toFixed(4)}`);
      setAnimatedOutput('out-rag-llm', `$${(llmInputCost + llmOutputCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-rag-savings', `$${cachingSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    };
    ragForm.addEventListener('input', calcRAG);
    calcRAG();
  }

  // 3. AI Use Case Prioritiser
  const priorForm = document.getElementById('prioritiser-form');
  if (priorForm) {
    const calcPrior = () => {
      const val = (parseFloat(document.getElementById('p-biz-val').value) + parseFloat(document.getElementById('p-cust-val').value)) / 2;
      const comp = (parseFloat(document.getElementById('p-complexity').value) + parseFloat(document.getElementById('p-risk').value)) / 2;
      
      let quad = "STRATEGIC BETS";
      let rec = "High value, high complexity. Requires dedicated architect, risk review, and phased validation.";
      let badgeClass = "badge-trial";

      if (val >= 6 && comp <= 5) {
        quad = "QUICK WINS";
        rec = "High business value with manageable implementation complexity. Prioritize for immediate sprint delivery.";
        badgeClass = "badge-adopt";
      } else if (val < 6 && comp <= 5) {
        quad = "EXPERIMENTS";
        rec = "Low complexity, moderate value. Excellent candidate for team hackathons or exploratory validation.";
        badgeClass = "badge-assess";
      } else if (val < 6 && comp > 5) {
        quad = "DEFER";
        rec = "High complexity relative to business return. Re-evaluate once platform foundations mature.";
        badgeClass = "badge-watch";
      }

      document.getElementById('out-priority-quad').textContent = quad;
      document.getElementById('out-priority-rec').textContent = rec;
      const b = document.getElementById('out-priority-badge');
      if (b) {
        b.className = `badge ${badgeClass}`;
        b.textContent = quad;
      }
    };
    priorForm.addEventListener('input', calcPrior);
    calcPrior();
  }

  // 4. Build vs Buy AI Platform Calculator
  const bvbForm = document.getElementById('bvb-form');
  if (bvbForm) {
    const calcBvB = () => {
      const engCapability = parseFloat(document.getElementById('bvb-eng-cap').value) || 5;
      const teamSize = parseFloat(document.getElementById('bvb-team-size').value) || 5;
      const customNeeds = parseFloat(document.getElementById('bvb-custom').value) || 5;
      const compliance = parseFloat(document.getElementById('bvb-compliance').value) || 5;
      const timePressure = parseFloat(document.getElementById('bvb-time').value) || 5;
      
      // Build score weights
      const buildScore = (engCapability * 2.5) + (teamSize * 1.5) + (customNeeds * 2.0) + (compliance * 2.0) - (timePressure * 2.0);
      const normalizedScore = Math.max(0, Math.min(100, Math.round(buildScore * 1.3)));

      let verdict = "HYBRID APPROACH (Buy Core Gateway, Build Custom Extensions)";
      let rationale = "Recommended to license a battle-tested LLM Gateway / Security proxy while building in-house domain RAG workflows and evaluation suites.";

      if (normalizedScore > 68) {
        verdict = "BUILD IN-HOUSE PLATFORM";
        rationale = "Your engineering scale, bespoke workflow customization, and strict compliance constraints justify investing in a dedicated internal AI platform team.";
      } else if (normalizedScore < 42) {
        verdict = "BUY MANAGED PLATFORM";
        rationale = "Urgent time-to-market and focused team size make a commercial AI platform (e.g. AWS Bedrock / Azure AI / Portkey) significantly more cost-effective.";
      }

      document.getElementById('out-bvb-score').textContent = `${normalizedScore} / 100`;
      document.getElementById('out-bvb-verdict').textContent = verdict;
      document.getElementById('out-bvb-rationale').textContent = rationale;
    };
    bvbForm.addEventListener('input', calcBvB);
    calcBvB();
  }
}

/* Interactive Readiness Assessment */
function initAssessment() {
  const quizForm = document.getElementById('readiness-assessment-form');
  if (!quizForm) return;

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Calculate dimension scores
    const dimensions = {
      strategy: 0,
      data: 0,
      engineering: 0,
      governance: 0,
      operations: 0
    };
    const maxDims = { strategy: 15, data: 15, engineering: 15, governance: 15, operations: 15 };

    const radios = quizForm.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
      const dim = radio.getAttribute('data-dim');
      const val = parseInt(radio.value, 10) || 0;
      if (dim && dimensions[dim] !== undefined) {
        dimensions[dim] += val;
      }
    });

    const dimPercents = {
      strategy: Math.round((dimensions.strategy / maxDims.strategy) * 100),
      data: Math.round((dimensions.data / maxDims.data) * 100),
      engineering: Math.round((dimensions.engineering / maxDims.engineering) * 100),
      governance: Math.round((dimensions.governance / maxDims.governance) * 100),
      operations: Math.round((dimensions.operations / maxDims.operations) * 100)
    };

    const overallScore = Math.round(
      (dimPercents.strategy + dimPercents.data + dimPercents.engineering + dimPercents.governance + dimPercents.operations) / 5
    );

    let stage = "EXPLORE";
    let summary = "Initial exploratory experimentation. Prioritize defining clear ROI metrics and establishing evaluation golden test sets.";
    if (overallScore >= 80) {
      stage = "SCALE";
      summary = "Advanced maturity. Focus on platform cost distillation, autonomous model governance, and expanding federated AI squads.";
    } else if (overallScore >= 65) {
      stage = "PRODUCTIONISE";
      summary = "Ready for live customer-facing deployments. Harden OpenTelemetry tracing, automated rollbacks, and 24/7 on-call runbooks.";
    } else if (overallScore >= 48) {
      stage = "GOVERN";
      summary = "Strong technical validation. Critical next step is hardening security perimeters, RBAC trimming, and audit logging.";
    } else if (overallScore >= 32) {
      stage = "VALIDATE";
      summary = "Moving beyond sandbox prototypes. Focus on assembling empirical golden evaluation datasets and measuring unit economics.";
    }

    // Display Results
    const resBox = document.getElementById('assessment-results');
    if (resBox) {
      resBox.style.display = 'block';
      document.getElementById('res-overall-score').textContent = `${overallScore} / 100`;
      document.getElementById('res-stage').textContent = stage;
      document.getElementById('res-summary').textContent = summary;
      
      document.getElementById('res-strategy').textContent = `${dimPercents.strategy}%`;
      document.getElementById('res-data').textContent = `${dimPercents.data}%`;
      document.getElementById('res-engineering').textContent = `${dimPercents.engineering}%`;
      document.getElementById('res-governance').textContent = `${dimPercents.governance}%`;
      document.getElementById('res-operations').textContent = `${dimPercents.operations}%`;

      resBox.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const printBtn = document.getElementById('print-assessment-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}

/* Copy Buttons (Link & Code) and Toast */
function showToast(message = 'Copied to clipboard!') {
  let toast = document.querySelector('.toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2500);
}

function initCopyButtons() {
  // Share copy link buttons
  document.querySelectorAll('[data-copy-url]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-copy-url') || window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Page URL copied to clipboard! 📋');
      } catch (err) {
        showToast('Link copied!');
      }
    });
  });

  // Dedicated text / bio copy buttons
  document.querySelectorAll('[data-copy-text]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = btn.getAttribute('data-copy-text');
      const label = btn.getAttribute('data-copy-label') || 'Text';
      try {
        await navigator.clipboard.writeText(text);
        const originalText = btn.textContent;
        btn.textContent = 'Copied! ✓';
        showToast(`${label} copied to clipboard! 📋`);
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      } catch (err) {
        showToast('Copied to clipboard!');
      }
    });
  });

  // Code snippet copy buttons
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const codeBlock = btn.closest('.code-block');
      const codeEl = codeBlock ? codeBlock.querySelector('code, pre') : null;
      if (!codeEl) return;
      const text = codeEl.textContent;
      try {
        await navigator.clipboard.writeText(text);
        const originalText = btn.textContent;
        btn.textContent = 'Copied! ✓';
        showToast('Code snippet copied to clipboard! 📋');
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      } catch (err) {
        showToast('Code copied!');
      }
    });
  });

  // Auto-inject copy buttons for all code blocks, configs, and diagrams
  document.querySelectorAll('pre').forEach(pre => {
    if (pre.closest('.code-block') || pre.closest('.code-block-wrapped')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapped';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-snippet-btn';
    btn.setAttribute('aria-label', 'Copy snippet to clipboard');
    btn.innerHTML = '📋 Copy';

    btn.addEventListener('click', async () => {
      const text = pre.querySelector('code')?.innerText || pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        btn.innerHTML = '✓ Copied';
        showToast('Snippet copied to clipboard! 📋');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '📋 Copy';
        }, 2000);
      } catch (e) {
        showToast('Copied to clipboard!');
      }
    });

    wrapper.appendChild(btn);
  });
}

/* Executive Dark / Light Mode Theming System */
function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  
  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem('bm-theme');
      if (saved) return saved;
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('bm-theme', theme);
    } catch (e) {}
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      showToast(next === 'dark' ? 'Executive Midnight Mode 🌙' : 'Editorial Light Mode ☀️');
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    let hasSaved = false;
    try { hasSaved = Boolean(localStorage.getItem('bm-theme')); } catch (err) {}
    if (!hasSaved) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

/* Reading Progress Bar */
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight > 0) {
      const percent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      bar.style.width = percent + '%';
    } else {
      bar.style.width = '0%';
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* Accessible Interactive Tabs (e.g. First 90 Days Playbook) */
function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach(container => {
    const tabBtns = Array.from(container.querySelectorAll('[role="tab"]'));
    const tabPanels = Array.from(container.querySelectorAll('[role="tabpanel"]'));

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');

        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(p => {
          p.classList.remove('active');
          p.hidden = true;
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetPanel = container.querySelector('#' + targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
          targetPanel.hidden = false;
        }
      });

      // Keyboard navigation (Arrow keys)
      btn.addEventListener('keydown', (e) => {
        const index = tabBtns.indexOf(btn);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = tabBtns[(index + 1) % tabBtns.length];
          next.focus();
          next.click();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = tabBtns[(index - 1 + tabBtns.length) % tabBtns.length];
          prev.focus();
          prev.click();
        }
      });
    });
  });
}

/* Table of Contents Scroll Spy */
function initTocSpy() {
  const tocLinks = document.querySelectorAll('.toc-list a[href^="#"]');
  if (tocLinks.length === 0) return;

  const headings = Array.from(tocLinks).map(link => {
    const id = link.getAttribute('href').slice(1);
    return document.getElementById(id);
  }).filter(Boolean);

  if (headings.length === 0) return;

  function onScroll() {
    const scrollPos = window.scrollY + 140;
    let currentId = '';

    for (const h of headings) {
      if (h.offsetTop <= scrollPos) {
        currentId = h.id;
      } else {
        break;
      }
    }

    tocLinks.forEach(link => {
      const targetId = link.getAttribute('href').slice(1);
      if (targetId === currentId) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* Header Elevation on Scroll */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;
  const updateHeader = () => {
    if (window.scrollY > 15) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  updateHeader();
}

/* Interactive SVG Architecture Diagrams */
function initInteractiveDiagrams() {
  const diagramWraps = document.querySelectorAll('.arch-diagram-wrap');
  if (!diagramWraps.length) return;

  diagramWraps.forEach(wrap => {
    const nodes = wrap.querySelectorAll('.diagram-node');
    if (!nodes.length) return;

    nodes.forEach(node => {
      const highlight = () => {
        nodes.forEach(other => {
          if (other !== node) {
            other.style.opacity = '0.4';
          }
        });
      };
      const reset = () => {
        nodes.forEach(other => {
          other.style.opacity = '1';
        });
      };

      node.addEventListener('mouseenter', highlight);
      node.addEventListener('mouseleave', reset);
      node.addEventListener('focus', highlight);
      node.addEventListener('blur', reset);
    });
  });
}

/* Editorial Scroll Reveal (IntersectionObserver with graceful degradation) */
function initScrollReveal() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll(
    '.card, .authority-item, .platform-feature, .arch-diagram-wrap, .tool-layout, .matrix-table-wrap, .speaking-card'
  );

  if (!targets.length) return;

  // Stagger siblings in card grids
  document.querySelectorAll('.card-grid-3, .card-grid-2, .card-grid-4, .card-grid-5, .authority-bar').forEach(grid => {
    grid.classList.add('reveal-stagger');
  });

  if (isReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  targets.forEach(el => el.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  targets.forEach(el => observer.observe(el));
}

/* Ambient Cursor Spotlight (Zajno-inspired) */
function initCursorSpotlight() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const cards = document.querySelectorAll(
    '.card, .platform-feature, .authority-item, .speaking-card, .take-box'
  );
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', `-999px`);
      card.style.setProperty('--mouse-y', `-999px`);
    });
  });
}

/* Kinetic Masked Typography (Zajno-inspired) */
function initKineticTypography() {
  requestAnimationFrame(() => {
    document.documentElement.classList.add('is-loaded');
  });
}

/* Lenis Inertia Smooth Scroll (Zajno-inspired) */
function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window && window.innerWidth < 768) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js';
  script.onload = () => {
    if (window.Lenis) {
      const lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  };
  document.head.appendChild(script);
}

/* Living AI Pipeline Playground Simulator (Zajno-inspired) */
function initPipelineSimulator() {
  const sim = document.querySelector('.pipeline-simulator');
  if (!sim) return;

  const terminal = document.getElementById('sim-terminal');
  const buttons = sim.querySelectorAll('.sim-btn');
  const diagram = sim.closest('.arch-diagram-wrap');
  if (!terminal || !diagram) return;

  const nodes = {
    client: diagram.querySelector('[data-node="client"]'),
    gateway: diagram.querySelector('[data-node="gateway"]'),
    inference: diagram.querySelector('[data-node="inference"]'),
    telemetry: diagram.querySelector('[data-node="telemetry"]')
  };

  const scenarios = {
    cache: {
      steps: [
        { node: 'client', time: '00.0ms', tag: 'tag-client', tagName: '[CLIENT]', text: 'Incoming query: "Retrieve Q3 capital adequacy ratio formula for APRA review"' },
        { node: 'gateway', time: '+08.2ms', tag: 'tag-gw', tagName: '[GATEWAY]', text: 'PII check: Clean · Semantic cache hit (0.97 match) · Cost: $0.0000', success: true },
        { node: 'telemetry', time: '+11.4ms', tag: 'tag-telemetry', tagName: '[TELEMETRY]', text: 'OTEL trace CBA-9142 exported. Zero LLM egress cost · 11.4ms TTL', success: true }
      ]
    },
    rag: {
      steps: [
        { node: 'client', time: '00.0ms', tag: 'tag-client', tagName: '[CLIENT]', text: 'Query: "Analyze mortgage stress variance across postcodes 3000-3020"' },
        { node: 'gateway', time: '+14.5ms', tag: 'tag-gw', tagName: '[GATEWAY]', text: 'PII verified · Cache miss (new scenario) · Token quota 12k approved' },
        { node: 'inference', time: '+62.0ms', tag: 'tag-rag', tagName: '[HYBRID-RAG]', text: 'BM25 (k=4) + Vector dense (k=6) fused via RRF · 5 grounded chunks retrieved' },
        { node: 'inference', time: '+112.4ms', tag: 'tag-rag', tagName: '[RERANK]', text: 'Cross-encoder scoring top-5 · Context 1,840 tokens synthesized' },
        { node: 'telemetry', time: '+138.8ms', tag: 'tag-telemetry', tagName: '[TELEMETRY]', text: 'Span CBA-RAG-204 completed · Cost: $0.0048 · Accuracy check: 98.6%', success: true }
      ]
    },
    pii: {
      steps: [
        { node: 'client', time: '00.0ms', tag: 'tag-client', tagName: '[CLIENT]', text: 'Query: "Verify account 4520-XXXX-8910 and Tax File Number 401-291-801"' },
        { node: 'gateway', time: '+18.2ms', tag: 'tag-gw', tagName: '[GATEWAY]', text: 'ALERT: Regulated PII pattern detected (TFN / PAN) · Cryptographic token replacement initiated', warning: true },
        { node: 'gateway', time: '+24.0ms', tag: 'tag-gw', tagName: '[GATEWAY]', text: 'PII sanitized to [CUSTOMER_TOKEN_99A] · Security audit log CBA-SEC-AUDIT emitted', success: true },
        { node: 'inference', time: '+68.5ms', tag: 'tag-rag', tagName: '[INFERENCE]', text: 'Sanitized token context processed safely without PII egress' },
        { node: 'telemetry', time: '+84.2ms', tag: 'tag-telemetry', tagName: '[TELEMETRY]', text: 'Audit event SEC-PII-CLEAN logged to SIEM · Zero compliance breach', success: true }
      ]
    }
  };

  let activeTimeouts = [];

  function clearActiveNodes() {
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
    Object.values(nodes).forEach(n => {
      if (n) {
        n.classList.remove('is-sim-active', 'is-sim-warning');
      }
    });
  }

  function runScenario(key) {
    const scenario = scenarios[key];
    if (!scenario) return;

    clearActiveNodes();
    terminal.innerHTML = '';

    buttons.forEach(b => b.classList.toggle('is-active', b.getAttribute('data-sim') === key));

    scenario.steps.forEach((step, idx) => {
      const delay = idx * 380;
      const t = setTimeout(() => {
        // Activate node
        Object.values(nodes).forEach(n => n && n.classList.remove('is-sim-active', 'is-sim-warning'));
        const targetNode = nodes[step.node];
        if (targetNode) {
          targetNode.classList.add(step.warning ? 'is-sim-warning' : 'is-sim-active');
        }

        // Add log line
        const line = document.createElement('div');
        line.className = `sim-log-line ${step.success ? 'is-success' : ''} ${step.warning ? 'is-warning' : ''}`;
        line.innerHTML = `
          <span class="log-ts">${step.time}</span>
          <span class="log-tag ${step.tag}">${step.tagName}</span>
          <span class="log-msg">${step.text}</span>
        `;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;

        if (idx === scenario.steps.length - 1) {
          const finalT = setTimeout(() => {
            if (targetNode) targetNode.classList.remove('is-sim-active', 'is-sim-warning');
          }, 1400);
          activeTimeouts.push(finalT);
        }
      }, delay);
      activeTimeouts.push(t);
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const simType = btn.getAttribute('data-sim');
      runScenario(simType);
    });
  });
}

/* Interactive Living Hero Motion Stream (Zajno-inspired Canvas) */
function initHeroMotionCanvas() {
  const canvas = document.getElementById('hero-motion-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = canvas.parentElement.clientWidth - 40);
  let height = (canvas.height = 90);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth - 40;
    height = canvas.height = 90;
  }, { passive: true });

  let mouseX = -999;
  let mouseY = -999;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouseX = -999;
    mouseY = -999;
  });

  // Particle tokens traveling along pipeline
  const particles = Array.from({ length: 16 }, () => ({
    x: Math.random() * width,
    waveIndex: Math.floor(Math.random() * 3),
    speed: 0.8 + Math.random() * 1.5,
    radius: 2 + Math.random() * 2,
    alpha: 0.45 + Math.random() * 0.55
  }));

  const waves = [
    { freq: 0.007, speed: 0.022, amp: 20, color: 'rgba(157, 64, 43, 0.45)' },
    { freq: 0.011, speed: 0.032, amp: 14, color: 'rgba(34, 197, 94, 0.4)' },
    { freq: 0.005, speed: 0.016, amp: 22, color: 'rgba(232, 236, 233, 0.3)' }
  ];

  let frame = 0;

  function render() {
    frame++;
    ctx.clearRect(0, 0, width, height);

    // Render waves
    waves.forEach((w, idx) => {
      ctx.beginPath();
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 1.6;

      const baseMid = height * 0.5 + (idx - 1) * 5;

      for (let x = 0; x <= width; x += 3) {
        let y = baseMid + Math.sin(x * w.freq + frame * w.speed) * w.amp;

        // Interactive mouse displacement ripple (Zajno physics feel)
        if (mouseX > -100) {
          const dist = Math.abs(x - mouseX);
          if (dist < 110) {
            y += (1 - dist / 110) * 16 * Math.cos(frame * 0.1);
          }
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });

    // Render streaming token particles
    particles.forEach(p => {
      p.x += p.speed;
      if (p.x > width + 10) p.x = -10;

      const w = waves[p.waveIndex];
      const baseMid = height * 0.5 + (p.waveIndex - 1) * 5;
      let y = baseMid + Math.sin(p.x * w.freq + frame * w.speed) * w.amp;

      if (mouseX > -100) {
        const dist = Math.abs(p.x - mouseX);
        if (dist < 110) {
          y += (1 - dist / 110) * 16 * Math.cos(frame * 0.1);
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.waveIndex === 0 ? `rgba(244, 234, 231, ${p.alpha})` : (p.waveIndex === 1 ? `rgba(74, 222, 128, ${p.alpha})` : `rgba(211, 212, 201, ${p.alpha})`);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
