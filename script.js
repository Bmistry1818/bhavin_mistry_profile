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

  // Living 3D Spatial AI Topology Engine (Interactive Drag-to-Orbit + Modes)
  initHeroMotionCanvas();

  // Interactive 3D Perspective Tilt on Feature Cards
  initTilt3D();

  // Interactive Homepage Architecture Packet Simulator
  initHomeArchFlow();

  // Interactive Orbital AI Radar Sweeper & Filter
  initRadarSweeper();

  // Enterprise Top 5 Skills Velocity Calculator & Spec Downloader
  initEnterpriseSkillsWorkbench();

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

/* Command Palette (Cmd+K / Ctrl+K) using Native HTML5 Dialog */
function initCommandPalette() {
  const searchTriggers = document.querySelectorAll('.search-trigger, [data-open-palette]');
  const dialog = document.getElementById('command-palette-dialog') || document.getElementById('command-palette-modal');
  if (!dialog) return;

  const isNativeDialog = typeof dialog.showModal === 'function' && dialog.tagName === 'DIALOG';
  const input = dialog.querySelector('.palette-input');
  const resultsContainer = dialog.querySelector('.palette-results');
  const closeBtn = dialog.querySelector('[data-close-palette]');

  const searchIndex = [
    { title: "Sovereign AI & Open-Weight Governance (Qwen4, DeepSeek-V4, GLM-5.4, Kimi K3.1)", url: "/insights/sovereign-ai-open-weight-governance-playbook/", category: "Insight" },
    { title: "Enterprise Multi-Protocol Agentic Mesh (MCP + A2A)", url: "/architectures/enterprise-mcp-a2a-agentic-mesh/", category: "Architecture" },
    { title: "Model Context Protocol (MCP) in Enterprise Production", url: "/insights/model-context-protocol-enterprise-production-blueprint/", category: "Insight" },
    { title: "Enterprise AI Across Regulated Industries (Banking, Healthcare, Telecom, Gov, Retail)", url: "/industries/", category: "Industry Matrix" },
    { title: "Top 5 Enterprise AI Engineering Skills (+50% Velocity on Existing Tools)", url: "/tools/enterprise-ai-skills/", category: "Tool" },
    { title: "Model Router & SLM Distillation ROI Simulator", url: "/tools/model-router-cost-calculator/", category: "Tool" },
    { title: "AI-Enabled SDLC & DORA Velocity Modeler", url: "/tools/ai-sdlc-dora-roi-calculator/", category: "Tool" },
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
    if (isNativeDialog) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.classList.add('is-active');
      dialog.setAttribute('aria-hidden', 'false');
    }
    if (input) {
      input.value = '';
      input.focus();
      renderResults(searchIndex.slice(0, 7));
    }
  }

  function closePalette() {
    if (isNativeDialog) {
      if (dialog.open) dialog.close();
    } else {
      dialog.classList.remove('is-active');
      dialog.setAttribute('aria-hidden', 'true');
    }
  }

  function renderResults(items) {
    if (!resultsContainer) return;
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 24px; text-align: center; color: var(--muted); font-size: 13px;';
      empty.textContent = 'No resources found. Try another query.';
      resultsContainer.replaceChildren(empty);
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
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.content = next;
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

  // Light dismiss fallback for browsers without closedby="any"
  if (isNativeDialog) {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e, el) => {
        const r = el.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
      dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) closePalette(); });
    }
  } else {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closePalette();
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (isNativeDialog) {
        dialog.open ? closePalette() : openPalette();
      } else {
        dialog.classList.contains('is-active') ? closePalette() : openPalette();
      }
    }
    if (e.key === 'Escape' && !isNativeDialog && dialog.classList.contains('is-active')) {
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

  // 5. Model Router & SLM Distillation Calculator
  const mrForm = document.getElementById('model-router-form');
  if (mrForm) {
    const calcMR = () => {
      const monthlyQueries = parseFloat(document.getElementById('mr-monthly-queries').value) || 0;
      const promptTokens = parseFloat(document.getElementById('mr-prompt-tokens').value) || 0;
      const completionTokens = parseFloat(document.getElementById('mr-completion-tokens').value) || 0;
      const frontierInPrice = parseFloat(document.getElementById('mr-frontier-input').value) || 3.0;
      const frontierOutPrice = parseFloat(document.getElementById('mr-frontier-output').value) || 15.0;
      const slmInPrice = parseFloat(document.getElementById('mr-slm-input').value) || 0.15;
      const slmOutPrice = parseFloat(document.getElementById('mr-slm-output').value) || 0.60;
      const slmRatio = (parseFloat(document.getElementById('mr-router-ratio').value) || 0) / 100;
      const cacheHit = (parseFloat(document.getElementById('mr-cache-hit').value) || 0) / 100;

      // Update slider badge labels
      const valRatioEl = document.getElementById('val-mr-router-ratio');
      if (valRatioEl) valRatioEl.textContent = `${Math.round(slmRatio * 100)}%`;
      const valCacheEl = document.getElementById('val-mr-cache-hit');
      if (valCacheEl) valCacheEl.textContent = `${Math.round(cacheHit * 100)}%`;

      // Cache hits bypass model execution completely
      const queriesToRoute = monthlyQueries * (1 - cacheHit);

      // Baseline: 100% Frontier Model
      const baselineCost = ((queriesToRoute * promptTokens / 1_000_000) * frontierInPrice) +
                           ((queriesToRoute * completionTokens / 1_000_000) * frontierOutPrice);

      // Hybrid Route:
      const slmQueries = queriesToRoute * slmRatio;
      const frontierQueries = queriesToRoute * (1 - slmRatio);

      const slmCost = ((slmQueries * promptTokens / 1_000_000) * slmInPrice) +
                      ((slmQueries * completionTokens / 1_000_000) * slmOutPrice);
      const frontierCost = ((frontierQueries * promptTokens / 1_000_000) * frontierInPrice) +
                           ((frontierQueries * completionTokens / 1_000_000) * frontierOutPrice);

      const hybridCost = slmCost + frontierCost;
      const monthlySavings = Math.max(0, baselineCost - hybridCost);
      const annualSavings = monthlySavings * 12;
      const pctSavings = baselineCost > 0 ? ((monthlySavings / baselineCost) * 100).toFixed(1) : '0';

      // P95 Latency estimate (Cache ~30ms, SLM ~180ms, Frontier ~1600ms)
      const p95Latency = Math.round(
        (cacheHit * 30) + ((1 - cacheHit) * ((slmRatio * 180) + ((1 - slmRatio) * 1600)))
      );

      // Data kept inside private perimeter (Cache hits + SLM routed)
      const privateDataPct = Math.round((cacheHit + ((1 - cacheHit) * slmRatio)) * 100);

      setAnimatedOutput('out-mr-monthly-savings', `$${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-mr-annual-savings', `$${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-mr-baseline-spend', `$${baselineCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-mr-hybrid-spend', `$${hybridCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      setAnimatedOutput('out-mr-pct-savings', `${pctSavings}%`);
      setAnimatedOutput('out-mr-p95-latency', `${p95Latency} ms`);
      setAnimatedOutput('out-mr-private-data', `${privateDataPct}%`);
    };
    mrForm.addEventListener('input', calcMR);
    document.querySelectorAll('[data-mr-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('mr-frontier-input').value = btn.dataset.fi;
        document.getElementById('mr-frontier-output').value = btn.dataset.fo;
        document.getElementById('mr-slm-input').value = btn.dataset.si;
        document.getElementById('mr-slm-output').value = btn.dataset.so;
        document.getElementById('mr-router-ratio').value = btn.dataset.ratio;
        document.getElementById('mr-cache-hit').value = btn.dataset.cache;
        const govEl = document.getElementById('out-mr-gov-posture');
        if (govEl && btn.dataset.gov) govEl.textContent = btn.dataset.gov;
        calcMR();
      });
    });
    calcMR();
  }

  // 6. AI-Enabled SDLC & DORA Velocity Modeler
  const doraForm = document.getElementById('sdlc-dora-form');
  if (doraForm) {
    const calcDora = () => {
      const engineers = parseFloat(document.getElementById('dora-engineers').value) || 0;
      const salary = parseFloat(document.getElementById('dora-salary').value) || 0;
      const baselineCycle = parseFloat(document.getElementById('dora-cycle-time').value) || 3.8;
      const adoption = (parseFloat(document.getElementById('dora-adoption').value) || 0) / 100;
      const isAgentActive = document.getElementById('dora-agent-review').value === 'yes';
      const toolingCostPerDev = parseFloat(document.getElementById('dora-tooling-cost').value) || 480;

      const valAdoptionEl = document.getElementById('val-dora-adoption');
      if (valAdoptionEl) valAdoptionEl.textContent = `${Math.round(adoption * 100)}%`;

      // Hours saved per week per developer:
      const devHoursBase = 2.6;
      const devHoursAgent = isAgentActive ? 2.4 : 0;
      const totalHoursSavedPerDev = (devHoursBase + devHoursAgent) * adoption;

      // PR Cycle Time Reduction:
      const cycleReductionRatio = (isAgentActive ? 0.62 : 0.35) * adoption;
      const newCycleTime = Math.max(0.4, baselineCycle * (1 - cycleReductionRatio));
      const cycleTimeDropPct = Math.round(cycleReductionRatio * 100);

      // Financial value calculation:
      const hourlyRate = salary > 0 ? (salary / (46 * 38)) : 0;
      const totalWeeklyHoursTeam = engineers * totalHoursSavedPerDev;
      const grossAnnualValue = totalWeeklyHoursTeam * 46 * hourlyRate;

      // Tooling investment cost:
      const totalToolingCost = engineers * adoption * toolingCostPerDev;
      const netAnnualValue = Math.max(0, grossAnnualValue - totalToolingCost);
      const roiMultiple = totalToolingCost > 0 ? (grossAnnualValue / totalToolingCost).toFixed(1) : '0.0';

      // Equivalent FTE engineer capacity unlocked:
      const fteEquiv = (totalWeeklyHoursTeam / 38).toFixed(1);

      // DORA tier projection based on new cycle time
      let doraTier = "Elite (Multi-Daily Deployments)";
      if (newCycleTime > 3.0) {
        doraTier = "Medium (Bi-Weekly Releases)";
      } else if (newCycleTime > 1.5) {
        doraTier = "High (Daily to Weekly Releases)";
      }

      setAnimatedOutput('out-dora-annual-value', `$${netAnnualValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
      setAnimatedOutput('out-dora-tooling-roi', `${roiMultiple}x`);
      setAnimatedOutput('out-dora-new-cycle', `${newCycleTime.toFixed(1)} days`);
      setAnimatedOutput('out-dora-cycle-drop', `${cycleTimeDropPct}% faster`);
      setAnimatedOutput('out-dora-hours-saved', `${totalHoursSavedPerDev.toFixed(1)} hrs / dev / wk`);
      setAnimatedOutput('out-dora-fte-equiv', `${fteEquiv}`);
      setAnimatedOutput('out-dora-tier', doraTier);
    };
    doraForm.addEventListener('input', calcDora);
    calcDora();
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

/* Executive Dark / Light Mode Theming System (Modern Web Guidance) */
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
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme;
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
      const theme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = 'light dark';
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'bm-theme') {
      const theme = e.newValue || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = theme;
    }
  });
}

/* Reading Progress Bar (Compositor Animation with JS Scroll Fallback) */
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;

  // Modern Web Guidance: Native CSS Scroll-Driven Animations run on compositor thread
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()')) {
    return;
  }

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight > 0) {
      const progress = Math.min(1, Math.max(0, scrollTop / docHeight));
      bar.style.transform = `scaleX(${progress})`;
    } else {
      bar.style.transform = 'scaleX(0)';
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

/* Table of Contents Scroll Spy (Modern Web Guidance) */
function initTocSpy() {
  const tocLinks = document.querySelectorAll('.toc-list a[href^="#"]');
  if (tocLinks.length === 0) return;

  const headings = Array.from(tocLinks).map(link => {
    const id = link.getAttribute('href').slice(1);
    return document.getElementById(id);
  }).filter(Boolean);

  if (headings.length === 0) return;

  // Modern CSS scroll-target-group support
  if (window.CSS && CSS.supports && CSS.supports('scroll-target-group: auto')) {
    const syncAriaCurrent = () => {
      const currentLink = document.querySelector('.toc-list a:target-current');
      tocLinks.forEach(link => {
        const isCurrent = link === currentLink;
        link.setAttribute('aria-current', isCurrent ? 'true' : 'false');
        link.classList.toggle('is-active', isCurrent);
      });
    };
    syncAriaCurrent();
    document.addEventListener('scrollend', syncAriaCurrent);
    return;
  }

  // Modern IntersectionObserver fallback without manual scroll polling
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            link.setAttribute('aria-current', isActive ? 'true' : 'false');
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
    return;
  }

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
      const isActive = targetId === currentId;
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
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
    terminal.replaceChildren();

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

/* Interactive 3D Spatial AI Topology Engine (Drag-to-Orbit, Node Raycasting & Topology Modes) */
function initHeroMotionCanvas() {
  const canvas = document.getElementById('hero-motion-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const toggleBtn = document.getElementById('canvas-motion-toggle');
  const tooltipEl = document.getElementById('hero-3d-tooltip');
  const modeBtns = document.querySelectorAll('[data-3d-mode]');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isPaused = prefersReduced;
  let rafId = null;
  let activeMode = 'router';

  const updateToggleUI = () => {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-label', isPaused ? 'Play 3D pipeline animation' : 'Pause 3D pipeline animation');
    toggleBtn.textContent = isPaused ? 'Play 3D' : 'Pause 3D';
  };

  let width = 540;
  let height = 360;
  function sizeCanvas() {
    if (!canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.parentElement.clientWidth || 540;
    height = canvas.parentElement.clientHeight || 360;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame();
  }, { passive: true });

  // 3D Geometry Topologies
  const topologies = {
    router: {
      title: '3D Planner-Executor Sphere',
      hint: 'Drag to orbit · Hover node',
      nodes: [
        { label: 'Frontier Planner', role: 'Claude / GPT-6.2 / Gemini 4 Carbon architectural reasoning', x: 0, y: -0.95, z: 0, color: '#60a5fa', r: 9 },
        { label: 'Gateway Classifier', role: '8ms intent & schema Complexity Router', x: 0, y: 0, z: 0, color: '#f8fafc', r: 10 },
        { label: 'vLLM Qwen4 FP8', role: 'Onshore private cluster handling routine synthesis', x: 0.95, y: 0.45, z: 0.4, color: '#34d399', r: 8 },
        { label: 'DeepSeek Flash', role: 'High-throughput 180+ tok/s extraction path', x: -0.95, y: 0.45, z: -0.4, color: '#34d399', r: 8 },
        { label: 'Redis Cache', role: 'Semantic embedding vector cache layer', x: 0.45, y: 0.35, z: -0.95, color: '#fbbf24', r: 7 },
        { label: 'APRA Audit', role: 'Immutable OTEL & PII redaction boundary', x: -0.45, y: 0.35, z: 0.95, color: '#38bdf8', r: 7 }
      ],
      edges: [[0,1],[1,2],[1,3],[1,4],[1,5],[2,4],[3,5],[0,2],[0,3]]
    },
    mesh: {
      title: 'MCP + A2A Dual-Protocol Mesh',
      hint: 'Vertical Tools · Horizontal Peer Agents',
      nodes: [
        { label: 'Orchestrator', role: 'Reads A2A /.well-known/agent.json cards', x: 0, y: -0.85, z: 0, color: '#60a5fa', r: 9 },
        { label: 'Risk Agent A2A', role: 'APRA CPS 234 policy compliance peer agent', x: 1.0, y: -0.1, z: 0.3, color: '#38bdf8', r: 8 },
        { label: 'Coding Agent A2A', role: 'AGENTS.md & verification loop peer', x: -1.0, y: -0.1, z: -0.3, color: '#38bdf8', r: 8 },
        { label: 'MCP Tasks Broker', role: 'Async long-running builds & webhooks', x: 0, y: 0.15, z: 0.85, color: '#f8fafc', r: 9 },
        { label: 'SKILL.md Loader', role: 'On-demand tool schemas cutting context bloat 85%', x: 0.6, y: 0.85, z: -0.4, color: '#34d399', r: 7 },
        { label: 'Elicitation Gate', role: 'Human-in-the-loop mutation approval pause', x: -0.6, y: 0.85, z: 0.4, color: '#fbbf24', r: 8 }
      ],
      edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3],[3,4],[3,5],[4,5]]
    },
    vpc: {
      title: 'Sovereign Zero-Trust Enclave',
      hint: 'Onshore KMS · Zero Public Egress',
      nodes: [
        { label: 'mTLS Edge', role: 'Mutual TLS + short-lived OAuth2 STS tokens', x: 0, y: -0.9, z: 0.2, color: '#60a5fa', r: 9 },
        { label: 'PII Vault', role: 'TFN / PAN cryptographic tokenization proxy', x: 0, y: 0, z: 0, color: '#fbbf24', r: 10 },
        { label: 'SGLang TPU/GPU', role: 'KV-cache NVMe offloading in private enclave', x: 0.9, y: 0.25, z: -0.5, color: '#34d399', r: 8 },
        { label: 'GraphRAG DB', role: 'Neo4j + HNSW row-level access perimeter', x: -0.9, y: 0.25, z: 0.5, color: '#38bdf8', r: 8 },
        { label: 'License Guard', role: 'MIT / Apache 2.0 vs custom checkpoint audit', x: 0, y: 0.9, z: -0.2, color: '#f8fafc', r: 7 }
      ],
      edges: [[0,1],[1,2],[1,3],[1,4],[2,4],[3,4],[0,2],[0,3]]
    }
  };

  // Outer ambient wireframe geodesic vertices (12 vertices of icosahedron)
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawShell = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return { x: (x / len) * 1.35, y: (y / len) * 1.35, z: (z / len) * 1.35 };
  });
  const shellEdges = [];
  for (let i = 0; i < rawShell.length; i++) {
    for (let j = i + 1; j < rawShell.length; j++) {
      const d = Math.hypot(rawShell[i].x - rawShell[j].x, rawShell[i].y - rawShell[j].y, rawShell[i].z - rawShell[j].z);
      if (d < 1.48) shellEdges.push([i, j]);
    }
  }

  let rotX = 0.28;
  let rotY = 0.45;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let mouseX = -999;
  let mouseY = -999;
  let hoveredIdx = -1;
  let pulsePhase = 0;

  const project = (pt, scale) => {
    const cx = Math.cos(rotY + targetTiltY), sx = Math.sin(rotY + targetTiltY);
    const cy = Math.cos(rotX + targetTiltX), sy = Math.sin(rotX + targetTiltX);
    // Rotate Y then X
    const x1 = pt.x * cx - pt.z * sx;
    const z1 = pt.x * sx + pt.z * cx;
    const y2 = pt.y * cy - z1 * sy;
    const z2 = pt.y * sy + z1 * cy;
    const fov = 4.2;
    const depth = fov / (fov + z2 + 1.6);
    return {
      px: width * 0.5 + x1 * scale * depth,
      py: height * 0.40 + y2 * scale * depth,
      z: z2,
      scale: depth
    };
  };

  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (isDragging) {
      rotY += (e.clientX - lastX) * 0.008;
      rotX += (e.clientY - lastY) * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
      if (isPaused) drawFrame();
    } else {
      targetTiltY = ((mouseX / width) - 0.5) * 0.35;
      targetTiltX = ((mouseY / height) - 0.5) * -0.25;
      if (isPaused) drawFrame();
    }
  });
  canvas.addEventListener('pointerup', () => { isDragging = false; });
  canvas.addEventListener('pointerleave', () => {
    isDragging = false;
    mouseX = -999;
    mouseY = -999;
    targetTiltX = 0;
    targetTiltY = 0;
    hoveredIdx = -1;
    updateTooltip(null);
  });

  function updateTooltip(node) {
    if (!tooltipEl) return;
    const topo = topologies[activeMode];
    if (node) {
      tooltipEl.innerHTML = `<span><strong>${node.label}</strong> · ${node.role}</span><span>Depth Layer</span>`;
    } else {
      tooltipEl.innerHTML = `<span><strong>${topo.title}</strong> · ${topo.hint}</span><span>Interactive 3D Canvas</span>`;
    }
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-3d-mode');
      if (!topologies[m]) return;
      activeMode = m;
      modeBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      hoveredIdx = -1;
      updateTooltip(null);
      drawFrame();
    });
  });

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height) * 0.45;
    const topo = topologies[activeMode];

    // Subtle radial backdrop glow strictly anchored behind 3D mesh focal center
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.40, 12, width * 0.5, height * 0.40, scale * 1.45);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
    grad.addColorStop(1, 'rgba(7, 11, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 1. Render subtle geodesic containment shell
    const pShell = rawShell.map(p => project(p, scale));
    ctx.lineWidth = 0.85;
    shellEdges.forEach(([i, j]) => {
      const a = pShell[i], b = pShell[j];
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    });

    // 2. Project active topology nodes & detect hover
    const pNodes = topo.nodes.map((n, idx) => ({ ...n, idx, ...project(n, scale) }));
    hoveredIdx = -1;
    let bestDist = 26;
    if (mouseX > -100) {
      pNodes.forEach(pn => {
        const d = Math.hypot(pn.px - mouseX, pn.py - mouseY);
        if (d < bestDist) {
          bestDist = d;
          hoveredIdx = pn.idx;
        }
      });
    }
    if (!isDragging && hoveredIdx !== -1) {
      updateTooltip(topo.nodes[hoveredIdx]);
    } else if (!isDragging && mouseX < -50) {
      updateTooltip(null);
    }

    // 3. Draw 3D edges + animated signal packets
    topo.edges.forEach(([i, j], eIdx) => {
      const a = pNodes[i], b = pNodes[j];
      const highlight = hoveredIdx === i || hoveredIdx === j;
      ctx.strokeStyle = highlight ? 'rgba(96, 165, 250, 0.85)' : 'rgba(96, 165, 250, 0.34)';
      ctx.lineWidth = highlight ? 1.8 : 1.15;
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();

      // Signal pulse dot along 3D edge
      const t = (pulsePhase + eIdx * 0.27) % 1;
      const sx = a.px + (b.px - a.px) * t;
      const sy = a.py + (b.py - a.py) * t;
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Depth-sort (painter's algorithm) and draw 3D nodes + labels
    pNodes.slice().sort((a, b) => b.z - a.z).forEach(pn => {
      const radius = pn.r * pn.scale * (hoveredIdx === pn.idx ? 1.35 : 1);
      const alpha = Math.max(0.45, Math.min(1, 0.55 + pn.scale * 0.45));

      ctx.beginPath();
      ctx.arc(pn.px, pn.py, radius * 1.9, 0, Math.PI * 2);
      ctx.fillStyle = hoveredIdx === pn.idx ? 'rgba(96, 165, 250, 0.32)' : 'rgba(96, 165, 250, 0.10)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pn.px, pn.py, radius, 0, Math.PI * 2);
      ctx.fillStyle = pn.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = `600 ${Math.round(10 * Math.max(0.85, pn.scale))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = hoveredIdx === pn.idx ? '#ffffff' : 'rgba(226, 232, 240, 0.88)';
      ctx.textAlign = 'center';
      ctx.fillText(pn.label, pn.px, pn.py - radius - 7);
    });
  }

  function tick() {
    if (isPaused) {
      rafId = null;
      return;
    }
    if (!isDragging) {
      rotY += 0.0045;
    }
    pulsePhase = (pulsePhase + 0.008) % 1;
    drawFrame();
    rafId = requestAnimationFrame(tick);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      updateToggleUI();
      if (!isPaused && !rafId) tick();
    });
  }

  updateToggleUI();
  updateTooltip(null);
  drawFrame();
  if (!isPaused) tick();
}

/* Interactive 3D Perspective Card Tilt */
function initTilt3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('[data-tilt-3d]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--rx', `${(-y * 5.5).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 6.5).toFixed(2)}deg`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* Interactive Homepage Agentic Mesh Packet Flow */
function initHomeArchFlow() {
  const wrap = document.querySelector('[data-home-arch-sim]');
  if (!wrap) return;

  const statusEl = document.getElementById('home-arch-status');
  const btns = wrap.querySelectorAll('[data-home-sim]');
  const nodes = {
    agent: wrap.querySelector('[data-arch-node="agent"]'),
    gateway: wrap.querySelector('[data-arch-node="gateway"]'),
    target: wrap.querySelector('[data-arch-node="target"]')
  };

  const paths = {
    mcp: { node: 'gateway', msg: 'MCP Task Dispatched: Lazy-loaded SKILL.md guide -> Async webhook queued' },
    a2a: { node: 'agent', msg: 'A2A Delegation: Signed /.well-known/agent.json card verified · Hop depth 1/3' },
    elicitation: { node: 'target', msg: 'Elicitation Gate: Production mutation paused awaiting human signoff' }
  };

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-home-sim');
      const spec = paths[key];
      if (!spec) return;
      btns.forEach(b => b.classList.toggle('is-active', b === btn));
      Object.values(nodes).forEach(n => n && n.classList.remove('is-sim-active', 'is-sim-warning'));
      const targetNode = nodes[spec.node];
      if (targetNode) targetNode.classList.add(key === 'elicitation' ? 'is-sim-warning' : 'is-sim-active');
      if (statusEl) statusEl.textContent = spec.msg;
    });
  });
}

/* Interactive Orbital AI Radar Sweeper & Quadrant Filter (/ai-radar/) */
function initRadarSweeper() {
  const canvas = document.getElementById('radar-sweeper-canvas');
  const dataEl = document.getElementById('radar-json-data');
  if (!canvas || !dataEl) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let items = [];
  try { items = JSON.parse(dataEl.textContent); } catch { return; }

  const infoEl = document.getElementById('radar-sweeper-info');
  const toggleBtn = document.getElementById('radar-motion-toggle');
  const filterBtns = document.querySelectorAll('[data-radar-filter]');
  const cols = document.querySelectorAll('#radar-columns [data-quadrant]');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isPaused = prefersReduced;
  let angle = 0.6;
  let activeFilter = 'ALL';
  let rafId = null;

  const ringRadius = { ADOPT: 0.28, TRIAL: 0.50, ASSESS: 0.72, WATCH: 0.90 };
  const ringColors = { ADOPT: '#16a34a', TRIAL: '#2563eb', ASSESS: '#d97706', WATCH: '#7c3aed' };
  const quadAngleBase = { ADOPT: 0.25, TRIAL: 1.85, ASSESS: 3.45, WATCH: 5.05 };
  const counts = { ADOPT: 0, TRIAL: 0, ASSESS: 0, WATCH: 0 };

  const blips = items.map(it => {
    const idx = counts[it.quadrant] || 0;
    counts[it.quadrant] = idx + 1;
    const theta = (quadAngleBase[it.quadrant] || 0) + idx * 0.24;
    const rad = (ringRadius[it.quadrant] || 0.5) + ((idx % 2) * 0.05 - 0.025);
    return { ...it, theta, rad };
  });

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 400 * dpr;
  canvas.height = 400 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let mx = -999, my = -999;
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) * (400 / r.width);
    my = (e.clientY - r.top) * (400 / r.height);
    if (isPaused) render();
  });
  canvas.addEventListener('mouseleave', () => { mx = -999; my = -999; });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-radar-filter');
      filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      cols.forEach(col => {
        const q = col.getAttribute('data-quadrant');
        col.style.display = (activeFilter === 'ALL' || activeFilter === q) ? '' : 'none';
      });
      render();
    });
  });

  const updateToggle = () => {
    if (!toggleBtn) return;
    toggleBtn.textContent = isPaused ? 'Play Sweep' : 'Pause Sweep';
  };
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      updateToggle();
      if (!isPaused && !rafId) loop();
    });
  }

  function render() {
    ctx.clearRect(0, 0, 400, 400);
    const cx = 200, cy = 200, R = 185;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ringLine = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.14)';

    // Rings
    [0.32, 0.54, 0.76, 0.96].forEach(ratio => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = ringLine;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.strokeStyle = ringLine;
    ctx.stroke();

    // Sweeper beam
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + 0.45);
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(96, 165, 250, 0.16)' : 'rgba(29, 78, 216, 0.12)';
    ctx.fill();

    // Blips
    let hovered = null;
    blips.forEach(b => {
      const visible = activeFilter === 'ALL' || activeFilter === b.quadrant;
      const bx = cx + Math.cos(b.theta) * (R * b.rad);
      const by = cy + Math.sin(b.theta) * (R * b.rad);
      const dist = Math.hypot(bx - mx, by - my);
      if (visible && dist < 14) hovered = b;

      ctx.beginPath();
      ctx.arc(bx, by, hovered === b ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = ringColors[b.quadrant] || '#2563eb';
      ctx.globalAlpha = visible ? 1 : 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (hovered && infoEl) {
      infoEl.innerHTML = `<strong>[${hovered.quadrant}] ${hovered.name}</strong> — ${hovered.rationale}`;
    }
  }

  function loop() {
    if (isPaused) { rafId = null; return; }
    angle = (angle + 0.018) % (Math.PI * 2);
    render();
    rafId = requestAnimationFrame(loop);
  }

  updateToggle();
  render();
  if (!isPaused) loop();
}

/* Enterprise Top 5 Skills Productivity Simulator & Single-File SKILL.md Download */
function initEnterpriseSkillsWorkbench() {
  const calc = document.querySelector('[data-enterprise-skills-calc]');
  if (calc) {
    const teamSlider = document.getElementById('skills-team-size');
    const baseSlider = document.getElementById('skills-base-hours');
    const teamValEl = document.getElementById('skills-team-size-val');
    const baseValEl = document.getElementById('skills-base-hours-val');
    const toggles = Array.from(calc.querySelectorAll('.skill-toggle-input'));

    const upliftEl = document.getElementById('skills-pct-uplift');
    const newHoursEl = document.getElementById('skills-new-hours');
    const reclaimedEl = document.getElementById('skills-reclaimed-hours');
    const fteEl = document.getElementById('skills-fte-unlocked');
    const annualEl = document.getElementById('skills-annual-hours');

    const update = () => {
      const teamSize = parseInt(teamSlider?.value || '120', 10);
      const baseHours = parseInt(baseSlider?.value || '22', 10);
      if (teamValEl) teamValEl.textContent = `${teamSize} Engineers`;
      if (baseValEl) baseValEl.textContent = `${baseHours} hrs/wk`;

      const reclaimedPerEng = toggles.reduce((sum, input) => {
        return input.checked ? sum + parseFloat(input.getAttribute('data-skill-hours') || '0') : sum;
      }, 0);

      // Cap total weekly hours realistically at 38h net build out of a 40h week
      const cappedReclaimed = Math.min(reclaimedPerEng, Math.max(0, 38 - baseHours));
      const newHours = baseHours + cappedReclaimed;
      const pct = baseHours > 0 ? (cappedReclaimed / baseHours) * 100 : 0;
      const fteUnlocked = baseHours > 0 ? (teamSize * (cappedReclaimed / baseHours)) : 0;
      const annualHours = Math.round(teamSize * cappedReclaimed * 48);

      if (upliftEl) upliftEl.textContent = `+${pct.toFixed(1)}%`;
      if (newHoursEl) newHoursEl.textContent = `${baseHours.toFixed(1)} → ${newHours.toFixed(1)} hrs`;
      if (reclaimedEl) reclaimedEl.textContent = `+${cappedReclaimed.toFixed(1)} hrs/wk`;
      if (fteEl) fteEl.textContent = `+${fteUnlocked.toFixed(1)} FTEs`;
      if (annualEl) annualEl.textContent = `${annualHours.toLocaleString()} hrs/yr`;
    };

    teamSlider?.addEventListener('input', update);
    baseSlider?.addEventListener('input', update);
    toggles.forEach(t => t.addEventListener('change', update));
    update();
  }

  document.querySelectorAll('.skill-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-skill-source');
      const filename = btn.getAttribute('data-skill-filename') || 'SKILL.md';
      const sourceEl = targetId ? document.getElementById(targetId) : null;
      if (!sourceEl) return;
      const blob = new Blob([sourceEl.textContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    });
  });
}
