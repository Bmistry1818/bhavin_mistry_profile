document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile navigation toggle
  initMobileNav();

  // Command palette & site search (Cmd+K)
  initCommandPalette();

  // Interactive Tools & Calculators (if on tool pages)
  initCalculators();

  // Assessment diagnostic (if on readiness tool page)
  initAssessment();
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
    { title: "Enterprise AI Engineering: From Experimentation to Production", url: "/insights/enterprise-ai-engineering-production-playbook/", category: "Insight" },
    { title: "Why Enterprise AI Agents Fail After the Demo", url: "/insights/why-enterprise-ai-agents-fail-after-the-demo/", category: "Insight" },
    { title: "Enterprise RAG Architecture: A Production Blueprint", url: "/insights/enterprise-rag-production-blueprint/", category: "Insight" },
    { title: "RAG vs Agentic RAG: Enterprise Decision Guide", url: "/insights/rag-vs-agentic-rag-enterprise-decision-guide/", category: "Insight" },
    { title: "AI Code Review Agents in the Enterprise SDLC", url: "/insights/ai-code-review-agent-engineering-sdlc/", category: "Insight" },
    { title: "Enterprise AI Governance Without Killing Innovation", url: "/insights/enterprise-ai-governance-without-killing-innovation/", category: "Insight" },
    { title: "Enterprise AI Research Hub", url: "/research/", category: "Research" },
    { title: "About Bhavin Mistry", url: "/about/", category: "About" },
    { title: "Enterprise AI Brief (Newsletter)", url: "/newsletter/", category: "Newsletter" }
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

      document.getElementById('out-cost-request').textContent = `$${costPerRequest.toFixed(4)}`;
      document.getElementById('out-cost-day').textContent = `$${dailyCost.toFixed(2)}`;
      document.getElementById('out-cost-month').textContent = `$${monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('out-cost-annual').textContent = `$${annualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

      document.getElementById('out-rag-month').textContent = `$${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('out-rag-query').textContent = `$${costPerQuery.toFixed(4)}`;
      document.getElementById('out-rag-llm').textContent = `$${(llmInputCost + llmOutputCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('out-rag-savings').textContent = `$${cachingSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
