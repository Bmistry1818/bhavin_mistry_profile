#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT_DIR, 'data/content.json');
const BLOGS_FILE = path.join(ROOT_DIR, 'data/blogs.json');

const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const blogsData = fs.existsSync(BLOGS_FILE) ? JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8')) : { blogs: [] };

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function renderHeader(currentPath = '/') {
  return `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <div class="container nav-wrap">
        <a href="/" class="brand" aria-label="Bhavin Mistry Home">
          Bhavin Mistry<span class="brand-period">.</span>
          <span class="brand-sub">Enterprise AI</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">
          <span class="sr-only">Open navigation</span>
          <span aria-hidden="true">Menu</span>
        </button>
        <nav id="main-nav" class="main-nav" aria-label="Main navigation">
          <a href="/insights/" class="${currentPath.startsWith('/insights') ? 'active' : ''}">Insights</a>
          <a href="/enterprise-ai-engineering/" class="${currentPath.startsWith('/enterprise-ai-engineering') ? 'active' : ''}">Handbook</a>
          <a href="/architectures/" class="${currentPath.startsWith('/architectures') ? 'active' : ''}">Architectures</a>
          <a href="/frameworks/enterprise-ai-production-readiness/" class="${currentPath.startsWith('/frameworks') ? 'active' : ''}">Framework</a>
          <a href="/ai-radar/" class="${currentPath.startsWith('/ai-radar') ? 'active' : ''}">AI Radar</a>
          <a href="/tools/" class="${currentPath.startsWith('/tools') ? 'active' : ''}">Tools</a>
          <a href="/about/" class="${currentPath.startsWith('/about') ? 'active' : ''}">About</a>
          <button class="search-trigger" type="button" aria-label="Search site">
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <a href="/newsletter/" class="nav-cta">Subscribe</a>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3>Bhavin Mistry<span class="brand-period">.</span></h3>
            <p>Building Enterprise AI That Actually Reaches Production. Practical frameworks, architectures, and engineering leadership from Melbourne, Australia.</p>
          </div>
          <div class="footer-col">
            <h4>Knowledge Hub</h4>
            <ul>
              <li><a href="/insights/">Enterprise Insights</a></li>
              <li><a href="/enterprise-ai-engineering/">AI Engineering Handbook</a></li>
              <li><a href="/architectures/">Architecture Library</a></li>
              <li><a href="/frameworks/enterprise-ai-production-readiness/">Production Readiness</a></li>
              <li><a href="/ai-radar/">Enterprise AI Radar</a></li>
              <li><a href="/research/">Research & Benchmarks</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Interactive Tools</h4>
            <ul>
              <li><a href="/tools/enterprise-ai-readiness/">AI Readiness Assessment</a></li>
              <li><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></li>
              <li><a href="/tools/llm-cost-calculator/">LLM Token Cost Estimator</a></li>
              <li><a href="/tools/ai-use-case-prioritiser/">Use Case Prioritiser</a></li>
              <li><a href="/tools/build-vs-buy-ai-platform/">Build vs Buy Calculator</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Ecosystem</h4>
            <ul>
              <li><a href="https://learnaiengineering.dev/" target="_blank" rel="noopener noreferrer">Learn AI Engineering ↗</a></li>
              <li><a href="https://www.linkedin.com/in/bhavin-mistry/" target="_blank" rel="noopener noreferrer">LinkedIn Profile ↗</a></li>
              <li><a href="https://medium.com/@bhavin_mistry" target="_blank" rel="noopener noreferrer">Medium Articles ↗</a></li>
              <li><a href="/feed.xml">RSS Feed</a></li>
              <li><a href="/llms.txt">llms.txt</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Newsletter</h4>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">Get the <em>Enterprise AI Brief</em> delivered to your inbox.</p>
            <a href="/newsletter/" class="btn btn-primary" style="padding: 10px 16px; font-size: 12px; width: 100%;">Subscribe Free</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© <span id="year">2026</span> Bhavin Mistry. All rights reserved. Melbourne, Australia.</p>
          <div style="display: flex; gap: 20px;">
            <a href="/about/">About Bhavin</a>
            <a href="/privacy/">Privacy Policy</a>
            <a href="/sitemap.xml">Sitemap</a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Command Palette Modal -->
    <div id="command-palette-modal" class="modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Quick Search and Command Palette">
      <div class="palette-window">
        <div class="palette-input-wrap">
          <span style="color: var(--muted); font-size: 14px;">🔍</span>
          <input type="text" class="palette-input" placeholder="Search architectures, frameworks, tools, insights..." aria-label="Search queries" autofocus />
          <button type="button" data-close-palette style="font-size: 16px; color: var(--muted);" aria-label="Close search">✕</button>
        </div>
        <div class="palette-results"></div>
        <div class="palette-footer">
          <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span>Press <kbd>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  `;
}

function renderHtmlPage({
  title,
  description,
  canonicalUrl,
  currentPath,
  mainContent,
  jsonLd = null,
  bodyClass = ''
}) {
  const schemaScript = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Bhavin Mistry",
      "url": "https://bhavinmistry.com/",
      "sameAs": [
        "https://www.linkedin.com/in/bhavin-mistry/",
        "https://medium.com/@bhavin_mistry"
      ],
      "jobTitle": "AI Strategy and Engineering Leader",
      "address": { "@type": "PostalAddress", "addressLocality": "Melbourne", "addressRegion": "Victoria", "addressCountry": "AU" }
    }
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- OpenGraph & Twitter -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="https://bhavinmistry.com/favicon.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://bhavinmistry.com/favicon.png" />
    
    <!-- Favicon & Icons -->
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="alternate" type="application/rss+xml" title="Bhavin Mistry Enterprise AI Insights RSS" href="/feed.xml" />
    <meta name="theme-color" content="#f5f2eb" />

    <link rel="stylesheet" href="/styles.css" />
    <script defer src="/script.js"></script>
    ${schemaScript}
  </head>
  <body id="top" class="${bodyClass}">
    ${renderHeader(currentPath)}
    <main id="main-content">
      ${mainContent}
    </main>
    ${renderFooter()}
  </body>
</html>`;
}

// 1. Build Homepage (index.html)
function buildHomepage() {
  const featuredInsights = content.insights.slice(0, 3);
  const featuredArchs = content.architectures.slice(0, 4);

  const main = `
    <!-- HERO SECTION -->
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-meta">
        <span>Enterprise AI • AI Engineering • Architecture</span>
        <span>Melbourne, Australia</span>
      </div>
      <h1 id="hero-title">Building Enterprise AI That Actually Reaches <em>Production.</em></h1>
      <div class="hero-grid">
        <p class="hero-lead">
          Practical frameworks, architectures, research, and perspectives for taking Generative AI and Agentic systems from exploratory experimentation to resilient, governed, scalable enterprise production.
        </p>
        <div class="hero-actions">
          <div class="btn-group">
            <a href="/insights/" class="btn btn-primary">Explore Insights</a>
            <a href="/enterprise-ai-engineering/" class="btn btn-secondary">AI Engineering Handbook</a>
          </div>
          <span class="hero-note">By Bhavin Mistry • Enterprise AI & Engineering Leader</span>
        </div>
      </div>

      <!-- AUTHORITY STATS / PILLARS -->
      <div class="authority-bar">
        <div class="authority-item">
          <div class="authority-label">Production Focus</div>
          <div class="authority-value">Zero Fluff</div>
          <div class="authority-desc">Architectures designed for APRA, SOC2, and enterprise latency SLAs.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">Flagship Framework</div>
          <div class="authority-value">5-Stage Maturity</div>
          <div class="authority-desc">Explore → Validate → Govern → Productionise → Scale.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">Architecture Library</div>
          <div class="authority-value">6 Reference Blueprints</div>
          <div class="authority-desc">Hybrid RAG, Agentic Workflows, AI Gateways, & LLMOps.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">Interactive Calculators</div>
          <div class="authority-value">5 Working Tools</div>
          <div class="authority-desc">Transparent financial and architectural decision models.</div>
        </div>
      </div>
    </section>

    <!-- FEATURED THINKING (INSIGHTS) -->
    <section class="section container" aria-labelledby="insights-title">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">Original Research & Perspectives</span>
          <h2 id="insights-title">Featured Thinking.</h2>
        </div>
        <p class="section-header-desc">
          Rigorous perspectives on enterprise LLM adoption, agent reliability, and the engineering disciplines required for measurable P&L return.
        </p>
      </div>

      <div class="card-grid-3">
        ${featuredInsights.map(insight => `
          <article class="card">
            <div class="card-meta">
              <span>${insight.category}</span>
              <span>${insight.readingTime}</span>
            </div>
            <h3><a href="/insights/${insight.slug}/">${insight.title}</a></h3>
            <p>${insight.summary}</p>
            <div class="card-footer">
              <span class="badge badge-accent">${insight.badge}</span>
              <a href="/insights/${insight.slug}/" class="text-link">Read Blueprint <span>→</span></a>
            </div>
          </article>
        `).join('')}
      </div>
      <div style="margin-top: 36px; text-align: center;">
        <a href="/insights/" class="btn btn-secondary">Explore All Insights & Perspectives →</a>
      </div>
    </section>

    <!-- SIGNATURE FRAMEWORK: ENTERPRISE AI PRODUCTION READINESS -->
    <section class="section section-wash" aria-labelledby="framework-title">
      <div class="container">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Signature Methodology</span>
            <h2 id="framework-title">Enterprise AI Production Readiness Framework.</h2>
          </div>
          <p class="section-header-desc">
            A structured model to diagnose AI maturity across Strategy, Data, Engineering, Governance, and Operations before committing capital.
          </p>
        </div>

        <div class="card-grid-4" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 32px;">
          ${content.frameworks.readiness.stages.map((st, i) => `
            <div class="card" style="padding: 24px;">
              <span class="eyebrow" style="margin-bottom: 8px;">Stage 0${i + 1}</span>
              <h4 style="font-size: 18px; margin-bottom: 8px;">${st.name}</h4>
              <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">${st.focus}</p>
              <div style="font-family: var(--mono); font-size: 11px; color: var(--accent); margin-top: auto;">
                ✓ ${st.milestone}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; background: var(--paper); padding: 24px 32px; border: 1px solid var(--line);">
          <div>
            <h4 style="margin-bottom: 4px;">Evaluate your organization's readiness score</h4>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">Complete the 18-question diagnostic to receive a custom dimension breakdown.</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <a href="/tools/enterprise-ai-readiness/" class="btn btn-primary">Take Readiness Assessment →</a>
            <a href="/frameworks/enterprise-ai-production-readiness/" class="btn btn-secondary">View 12-Dimension Matrix</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ARCHITECTURE LIBRARY PREVIEW -->
    <section class="section container" aria-labelledby="arch-title">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">Technical Blueprints</span>
          <h2 id="arch-title">AI Architecture Library.</h2>
        </div>
        <p class="section-header-desc">
          Web-native, production-grade reference architectures with component breakdowns, data flows, security perimeters, and failure modes.
        </p>
      </div>

      <div class="card-grid-2">
        ${featuredArchs.map(arch => `
          <div class="card">
            <div class="card-meta">
              <span class="badge badge-accent">${arch.category}</span>
              <span style="font-family: var(--mono); font-size: 11px;">Production Blueprint</span>
            </div>
            <h3><a href="/architectures/${arch.slug}/">${arch.title}</a></h3>
            <p>${arch.summary}</p>
            <div style="margin-bottom: 20px; font-size: 13px; color: var(--ink-soft); background: var(--wash); padding: 12px 16px; border-left: 2px solid var(--ink);">
              <strong>Core Problem:</strong> ${arch.problem}
            </div>
            <div class="card-footer">
              <a href="/architectures/${arch.slug}/" class="text-link">Inspect Architecture & Data Flow <span>→</span></a>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 36px; text-align: center;">
        <a href="/architectures/" class="btn btn-secondary">Explore Complete Architecture Library (6 Blueprints) →</a>
      </div>
    </section>

    <!-- ENTERPRISE AI RADAR PREVIEW -->
    <section class="section section-wash" aria-labelledby="radar-title">
      <div class="container">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Technology Landscape</span>
            <h2 id="radar-title">Enterprise AI Radar.</h2>
          </div>
          <p class="section-header-desc">
            Bhavin's curated technology tracking across Adopt, Trial, Assess, and Watch categories based on real-world enterprise viability.
          </p>
        </div>

        <div class="radar-grid">
          <div class="radar-column">
            <div class="radar-column-header">
              <h4 style="color: #166534;">ADOPT</h4>
              <span class="badge badge-adopt">Proven</span>
            </div>
            ${content.radar.filter(r => r.quadrant === 'ADOPT').slice(0, 2).map(item => `
              <div class="radar-item-card">
                <h4>${item.name}</h4>
                <p>${item.summary}</p>
              </div>
            `).join('')}
          </div>
          <div class="radar-column">
            <div class="radar-column-header">
              <h4 style="color: #0369a1;">TRIAL</h4>
              <span class="badge badge-trial">Validated</span>
            </div>
            ${content.radar.filter(r => r.quadrant === 'TRIAL').slice(0, 2).map(item => `
              <div class="radar-item-card">
                <h4>${item.name}</h4>
                <p>${item.summary}</p>
              </div>
            `).join('')}
          </div>
          <div class="radar-column">
            <div class="radar-column-header">
              <h4 style="color: #92400e;">ASSESS</h4>
              <span class="badge badge-assess">Spike</span>
            </div>
            ${content.radar.filter(r => r.quadrant === 'ASSESS').slice(0, 2).map(item => `
              <div class="radar-item-card">
                <h4>${item.name}</h4>
                <p>${item.summary}</p>
              </div>
            `).join('')}
          </div>
          <div class="radar-column">
            <div class="radar-column-header">
              <h4 style="color: #6b21a8;">WATCH</h4>
              <span class="badge badge-watch">Early</span>
            </div>
            ${content.radar.filter(r => r.quadrant === 'WATCH').slice(0, 2).map(item => `
              <div class="radar-item-card">
                <h4>${item.name}</h4>
                <p>${item.summary}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="/ai-radar/" class="btn btn-secondary">Explore Interactive Enterprise AI Radar →</a>
        </div>
      </div>
    </section>

    <!-- INTERACTIVE TOOLS HUB -->
    <section class="section container" aria-labelledby="tools-title">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">Decision Calculators</span>
          <h2 id="tools-title">Interactive Enterprise AI Tools.</h2>
        </div>
        <p class="section-header-desc">
          Transparent, client-side engineering and financial calculators with zero black-box assumptions.
        </p>
      </div>

      <div class="card-grid-3">
        <div class="card">
          <span class="eyebrow">Financial Modeling</span>
          <h3><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></h3>
          <p>Model monthly vector storage, embedding tokens, inference volume, and caching return across enterprise document pools.</p>
          <div class="card-footer">
            <a href="/tools/rag-cost-calculator/" class="text-link">Run Calculations <span>→</span></a>
          </div>
        </div>
        <div class="card">
          <span class="eyebrow">Unit Economics</span>
          <h3><a href="/tools/llm-cost-calculator/">LLM Token Cost Estimator</a></h3>
          <p>Compute daily, monthly, and annualized inference budgets based on prompt/completion ratios and prompt cache hits.</p>
          <div class="card-footer">
            <a href="/tools/llm-cost-calculator/" class="text-link">Estimate Spend <span>→</span></a>
          </div>
        </div>
        <div class="card">
          <span class="eyebrow">Portfolio Governance</span>
          <h3><a href="/tools/ai-use-case-prioritiser/">AI Use Case Prioritiser</a></h3>
          <p>Map candidate AI initiatives into Quick Wins, Strategic Bets, Experiments, or Defer based on business value and risk.</p>
          <div class="card-footer">
            <a href="/tools/ai-use-case-prioritiser/" class="text-link">Map Use Cases <span>→</span></a>
          </div>
        </div>
      </div>
      <div style="margin-top: 36px; display: flex; justify-content: center; gap: 16px;">
        <a href="/tools/build-vs-buy-ai-platform/" class="btn btn-secondary">Build vs Buy Calculator →</a>
        <a href="/tools/" class="btn btn-primary">View All Decision Tools →</a>
      </div>
    </section>

    <!-- ABOUT SECTION -->
    <section class="section section-wash" aria-labelledby="about-title">
      <div class="container" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 64px; align-items: start;">
        <div>
          <span class="eyebrow">Personal Entity</span>
          <h2 id="about-title">Bhavin Mistry.</h2>
          <p style="font-size: 18px; color: var(--ink-soft); line-height: 1.6; margin-top: 16px;">
            AI Strategy and Engineering Leader based in Melbourne, Australia.
          </p>
          <div style="margin-top: 24px;">
            <a href="/about/" class="btn btn-primary">Read Verified Profile →</a>
          </div>
        </div>
        <div style="background: var(--paper); padding: 36px; border: 1px solid var(--line);">
          <h4 style="margin-bottom: 12px;">Core Focus & Operating Philosophy</h4>
          <p style="font-size: 14px; color: var(--muted); line-height: 1.7;">
            My work sits at the intersection of enterprise AI strategy, technical architecture, and engineering leadership. I focus on taking generative AI, agentic systems, and retrieval architectures from exploratory prototypes to reliable, observable production systems in regulated industries like financial services.
          </p>
          <div style="border-top: 1px solid var(--line-subtle); padding-top: 20px; margin-top: 20px;">
            <span class="eyebrow" style="margin-bottom: 6px;">Verified Education</span>
            <div style="font-size: 14px; font-weight: 600;">The University of Texas at Austin</div>
            <div style="font-size: 13px; color: var(--muted);">Post Graduate Program in Artificial Intelligence and Machine Learning: Business Applications</div>
          </div>
        </div>
      </div>
    </section>
  `;

  const html = renderHtmlPage({
    title: "Bhavin Mistry | Building Enterprise AI That Actually Reaches Production",
    description: "Enterprise AI, AI Engineering, and Architecture knowledge platform by Bhavin Mistry. Practical frameworks, hybrid RAG blueprints, agentic systems, and decision tools.",
    canonicalUrl: "https://bhavinmistry.com/",
    currentPath: "/",
    mainContent: main,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Bhavin Mistry",
      "url": "https://bhavinmistry.com/",
      "author": {
        "@type": "Person",
        "name": "Bhavin Mistry",
        "jobTitle": "AI Strategy and Engineering Leader",
        "url": "https://bhavinmistry.com/about/",
        "sameAs": [
          "https://www.linkedin.com/in/bhavin-mistry/",
          "https://medium.com/@bhavin_mistry"
        ]
      },
      "description": "Building Enterprise AI That Actually Reaches Production. Practical frameworks, architectures, research, and perspectives from Bhavin Mistry."
    }
  });

  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), html);
  console.log('Generated: index.html');
}

// 2. Build Insights Hub & Individual Articles
function buildInsights() {
  ensureDir(path.join(ROOT_DIR, 'insights'));

  // Main Insights listing page
  const listMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 64px;">
      <span class="eyebrow">Knowledge Engine</span>
      <h1>Enterprise AI Insights & Field Notes</h1>
      <p class="hero-lead" style="max-width: 800px; margin-top: 16px; margin-bottom: 40px;">
        Architectural blueprints, failure analysis, and strategic perspectives on deploying Generative AI and Agentic Systems in production environments.
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--line);">
        <span class="badge badge-accent">All Categories</span>
        <span class="badge">Enterprise AI</span>
        <span class="badge">AI Engineering</span>
        <span class="badge">Agentic AI</span>
        <span class="badge">AI Architecture</span>
        <span class="badge">Financial Services AI</span>
      </div>

      <div class="card-grid-2">
        ${content.insights.map(post => `
          <article class="card">
            <div class="card-meta">
              <span class="badge badge-accent">${post.category}</span>
              <span>${post.readingTime}</span>
            </div>
            <h2><a href="/insights/${post.slug}/" style="font-size: 24px;">${post.title}</a></h2>
            <p style="margin-top: 12px;">${post.summary}</p>
            <div class="card-footer">
              <span style="font-family: var(--mono); font-size: 11px; color: var(--muted);">${post.publishedAt}</span>
              <a href="/insights/${post.slug}/" class="text-link">Read Blueprint <span>→</span></a>
            </div>
          </article>
        `).join('')}
      </div>

      <!-- Published LinkedIn / Medium Archive Section -->
      <div style="margin-top: 64px; padding-top: 48px; border-top: 1px solid var(--line);">
        <span class="eyebrow">External & Syndicate Writing Archive</span>
        <h3>Published Columns & Field Notes</h3>
        <p style="font-size: 14px; color: var(--muted); margin-bottom: 24px;">
          Previously published articles syndicated across LinkedIn and Medium, now maintained with local canonical schemas.
        </p>
        <div class="card-grid-3">
          ${blogsData.blogs.slice(0, 6).map(b => `
            <div class="card" style="padding: 24px;">
              <span class="badge" style="margin-bottom: 12px;">${b.source} Archive</span>
              <h4 style="margin-bottom: 8px;">${b.title}</h4>
              <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">${b.description || ''}</p>
              <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="text-link">Read on ${b.source} <span>↗</span></a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const listHtml = renderHtmlPage({
    title: "Enterprise AI Insights | Bhavin Mistry",
    description: "In-depth perspectives, blueprints, and architectural field notes on enterprise generative AI, hybrid RAG, agent reliability, and engineering leadership.",
    canonicalUrl: "https://bhavinmistry.com/insights/",
    currentPath: "/insights/",
    mainContent: listMain
  });

  fs.writeFileSync(path.join(ROOT_DIR, 'insights/index.html'), listHtml);
  console.log('Generated: insights/index.html');

  // Individual Article Pages
  content.insights.forEach(post => {
    const postDir = path.join(ROOT_DIR, `insights/${post.slug}`);
    ensureDir(postDir);

    const postMain = `
      <article class="container" style="max-width: 840px; padding-top: 64px; padding-bottom: 88px;">
        <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
          <a href="/">Home</a> / <a href="/insights/">Insights</a> / <span style="color: var(--ink);">${post.category}</span>
        </nav>

        <header style="margin-bottom: 40px;">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
            <span class="badge badge-accent">${post.category}</span>
            <span class="badge">${post.badge}</span>
            <span style="font-family: var(--mono); font-size: 11px; color: var(--muted); margin-left: auto;">${post.readingTime}</span>
          </div>
          <h1 style="font-size: clamp(36px, 5vw, 54px); margin-bottom: 20px;">${post.title}</h1>
          <p class="hero-lead" style="font-size: 20px; color: var(--muted);">${post.summary}</p>
          <div style="display: flex; gap: 24px; align-items: center; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 24px; font-size: 13px; color: var(--muted);">
            <span>By <strong><a href="/about/">Bhavin Mistry</a></strong></span>
            <span>Published: ${post.publishedAt}</span>
            <span>Updated: ${post.updatedAt}</span>
          </div>
        </header>

        <!-- "BHAVIN'S TAKE" EDITORIAL HIGHLIGHT BOX -->
        <div class="take-box">
          <div class="take-box-header">
            <span class="eyebrow">Editorial Analysis</span>
            <span class="badge badge-accent">Bhavin's Take</span>
          </div>
          <p style="font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 16px;">
            "${post.take.bhavinsTake}"
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; border-top: 1px solid var(--line); padding-top: 16px;">
            <div>
              <strong>Why Enterprises Should Care:</strong>
              <p style="color: var(--muted); margin-top: 4px;">${post.take.whyCare}</p>
            </div>
            <div>
              <strong>Architectural Impact:</strong>
              <p style="color: var(--muted); margin-top: 4px;">${post.take.architecturalImpact}</p>
            </div>
          </div>
        </div>

        <!-- ARTICLE BODY CONTENT -->
        <div class="article-content" style="font-size: 17px; line-height: 1.75; color: var(--ink-soft);">
          <h2 style="margin-top: 40px; margin-bottom: 16px;">The Production Disconnect</h2>
          <p>
            Across enterprise engineering teams in 2026, generative AI experimentation has reached saturation. Nearly every department has experimented with commercial LLM APIs, internal chat bots, and multi-agent prototypes. Yet, when technology leaders examine operating margins and P&L results, the value gap remains stark.
          </p>
          <p>
            The root cause is rarely the base intelligence of the frontier model. Instead, it is the absence of rigorous distributed systems engineering: unmonitored token egress, hallucinated citations in customer workflows, lack of document-level security filtering, and non-deterministic agent loops that compound errors over multi-hop executions.
          </p>

          <h2 style="margin-top: 40px; margin-bottom: 16px;">What Happened vs What Doesn't Change</h2>
          <div style="background: var(--paper-elevated); border: 1px solid var(--line); padding: 24px; margin: 24px 0;">
            <h4 style="margin-bottom: 8px;">What Changed in the Technology Landscape</h4>
            <p style="font-size: 14px; color: var(--muted);">${post.take.whatHappened}</p>
            <h4 style="margin-top: 16px; margin-bottom: 8px;">What Remains Invariant in Enterprise Systems</h4>
            <p style="font-size: 14px; color: var(--muted);">${post.take.whatDoesntChange}</p>
          </div>

          <h2 style="margin-top: 40px; margin-bottom: 16px;">Architectural Guidance & Action Plan</h2>
          <p>
            Moving from experimental spikes to hardened production requires treating AI components like any other mission-critical tier in your stack.
          </p>
          <ul style="margin-left: 24px; margin-bottom: 24px; font-size: 16px;">
            <li style="margin-bottom: 10px;"><strong>Enforce Centralised Gateways:</strong> Terminate all model invocations through internal routing proxies that enforce token quotas, PII redaction, and semantic caching.</li>
            <li style="margin-bottom: 10px;"><strong>Automate Continuous Evaluation:</strong> Reject vibe checks. Integrate golden evaluation sets (100–300 SME-validated queries) directly into CI/CD pipelines.</li>
            <li style="margin-bottom: 10px;"><strong>Bound Agent Autonomy:</strong> Replace free-form agent decision trees with constrained state machines and cryptographic approval fences for state-mutating actions.</li>
          </ul>

          <div style="background: var(--wash); padding: 24px; border: 1px solid var(--line); margin: 32px 0;">
            <h4 style="margin-bottom: 8px;">Immediate Action for Engineering Leaders</h4>
            <p style="font-size: 14px; color: var(--ink); margin-bottom: 0;">${post.take.whatToDoNext}</p>
          </div>
        </div>

        <!-- AUTHOR BIO & SHARING -->
        <div style="margin-top: 64px; padding: 32px; background: var(--paper-elevated); border: 1px solid var(--line); display: flex; gap: 24px; align-items: center;">
          <div>
            <span class="eyebrow" style="margin-bottom: 4px;">Author & Lead Architect</span>
            <h4 style="font-size: 18px; margin-bottom: 6px;">Bhavin Mistry</h4>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">
              Enterprise AI & Engineering Leader based in Melbourne, Australia. Focusing on production LLM architecture, agentic reliability, and engineering leadership.
            </p>
            <div style="display: flex; gap: 16px;">
              <a href="https://www.linkedin.com/in/bhavin-mistry/" target="_blank" rel="noopener noreferrer" class="text-link">LinkedIn Profile <span>↗</span></a>
              <a href="/about/" class="text-link">About Bhavin <span>→</span></a>
            </div>
          </div>
        </div>

        <!-- RELATED BLUEPRINTS & TOOLS -->
        <div style="margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--line);">
          <span class="eyebrow">Connected Resources</span>
          <h3>Related Production Architectures & Tools</h3>
          <div class="card-grid-2" style="margin-top: 20px;">
            <div class="card">
              <span class="eyebrow">Architecture</span>
              <h4><a href="/architectures/enterprise-rag/">Enterprise Hybrid RAG Blueprint</a></h4>
              <p style="font-size: 13px;">Full component breakdown and security boundaries for hybrid search.</p>
            </div>
            <div class="card">
              <span class="eyebrow">Interactive Tool</span>
              <h4><a href="/tools/enterprise-ai-readiness/">AI Readiness Diagnostic</a></h4>
              <p style="font-size: 13px;">Benchmark your organization's AI maturity across 5 dimensions.</p>
            </div>
          </div>
        </div>
      </article>
    `;

    const postHtml = renderHtmlPage({
      title: `${post.title} | Bhavin Mistry`,
      description: post.summary,
      canonicalUrl: `https://bhavinmistry.com/insights/${post.slug}/`,
      currentPath: `/insights/${post.slug}/`,
      mainContent: postMain,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": post.title,
        "description": post.summary,
        "datePublished": post.publishedAt,
        "dateModified": post.updatedAt,
        "author": {
          "@type": "Person",
          "name": "Bhavin Mistry",
          "url": "https://bhavinmistry.com/about/"
        },
        "publisher": {
          "@type": "Person",
          "name": "Bhavin Mistry"
        },
        "url": `https://bhavinmistry.com/insights/${post.slug}/`
      }
    });

    fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
    console.log(`Generated: insights/${post.slug}/index.html`);
  });
}

// 3. Build Architecture Library Hub & Detail Pages
function buildArchitectures() {
  ensureDir(path.join(ROOT_DIR, 'architectures'));

  const listMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 64px;">
      <span class="eyebrow">System Design</span>
      <h1>Enterprise AI Architecture Library</h1>
      <p class="hero-lead" style="max-width: 800px; margin-top: 16px; margin-bottom: 40px;">
        Production-tested reference architectures, data flows, security boundaries, and failure mode analyses for enterprise technology leaders.
      </p>

      <div class="card-grid-2">
        ${content.architectures.map(arch => `
          <div class="card">
            <div class="card-meta">
              <span class="badge badge-accent">${arch.category}</span>
              <span style="font-family: var(--mono); font-size: 11px;">Production Blueprint</span>
            </div>
            <h2><a href="/architectures/${arch.slug}/" style="font-size: 26px;">${arch.title}</a></h2>
            <p style="margin-top: 12px;">${arch.summary}</p>
            <div style="background: var(--wash); padding: 16px; border-left: 3px solid var(--accent); margin-bottom: 20px;">
              <strong style="font-size: 13px; color: var(--ink);">When To Use:</strong>
              <p style="font-size: 13px; color: var(--muted); margin-top: 4px; margin-bottom: 0;">${arch.whenToUse}</p>
            </div>
            <div class="card-footer">
              <a href="/architectures/${arch.slug}/" class="text-link">Inspect Architecture & Components <span>→</span></a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const listHtml = renderHtmlPage({
    title: "Enterprise AI Architecture Library | Bhavin Mistry",
    description: "Production-grade reference architectures for Enterprise RAG, Centralized AI Gateways, Agentic Systems, and LLM Observability by Bhavin Mistry.",
    canonicalUrl: "https://bhavinmistry.com/architectures/",
    currentPath: "/architectures/",
    mainContent: listMain
  });

  fs.writeFileSync(path.join(ROOT_DIR, 'architectures/index.html'), listHtml);
  console.log('Generated: architectures/index.html');

  // Detail Architecture Pages
  content.architectures.forEach(arch => {
    const archDir = path.join(ROOT_DIR, `architectures/${arch.slug}`);
    ensureDir(archDir);

    const archMain = `
      <article class="container" style="max-width: 920px; padding-top: 64px; padding-bottom: 88px;">
        <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
          <a href="/">Home</a> / <a href="/architectures/">Architectures</a> / <span style="color: var(--ink);">${arch.title}</span>
        </nav>

        <header style="margin-bottom: 36px;">
          <span class="badge badge-accent" style="margin-bottom: 12px;">${arch.category}</span>
          <h1 style="font-size: clamp(34px, 5vw, 50px); margin-bottom: 16px;">${arch.title}</h1>
          <p class="hero-lead" style="font-size: 20px; color: var(--muted);">${arch.summary}</p>
        </header>

        <!-- SVG ARCHITECTURE DIAGRAM -->
        <div class="arch-diagram-wrap">
          <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; margin-bottom: 16px; color: var(--muted-light);">
            <span>SYSTEM TOPOLOGY & DATA FLOW</span>
            <span>ENTERPRISE SPECIFICATION</span>
          </div>
          <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;">
            <!-- Client Layer -->
            <rect x="20" y="80" width="130" height="80" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
            <text x="85" y="115" fill="#e8ece9" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Client Application</text>
            <text x="85" y="135" fill="#8d9991" font-family="monospace" font-size="10" text-anchor="middle">RBAC Context</text>

            <!-- Arrow 1 -->
            <path d="M150 120 L220 120" stroke="#9d402b" stroke-width="2" marker-end="url(#arrow)" />

            <!-- Gateway / Security Layer -->
            <rect x="220" y="60" width="170" height="120" rx="4" fill="#2a332e" stroke="#9d402b" stroke-width="1.5" />
            <text x="305" y="95" fill="#f5f2eb" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Security & Gateway</text>
            <text x="305" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">PII Sanitization</text>
            <text x="305" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Semantic Cache Check</text>
            <text x="305" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Rate & Token Budget</text>

            <!-- Arrow 2 -->
            <path d="M390 120 L460 120" stroke="#9d402b" stroke-width="2" />

            <!-- Core Logic / Retrieval Engine -->
            <rect x="460" y="60" width="160" height="120" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
            <text x="540" y="95" fill="#e8ece9" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Inference & Rerank</text>
            <text x="540" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">BM25 + Vector Fusion</text>
            <text x="540" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Cross-Encoder Top-5</text>
            <text x="540" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Grounded Synthesis</text>

            <!-- Arrow 3 -->
            <path d="M620 120 L680 120" stroke="#9d402b" stroke-width="2" />

            <!-- Telemetry & Storage -->
            <rect x="680" y="80" width="100" height="80" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
            <text x="730" y="115" fill="#e8ece9" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Telemetry</text>
            <text x="730" y="135" fill="#8d9991" font-family="monospace" font-size="10" text-anchor="middle">OpenTelemetry</text>

            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9d402b"/>
              </marker>
            </defs>
          </svg>
        </div>

        <!-- SPECIFICATION GRID -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px;">
          <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line);">
            <h4 style="color: var(--accent); margin-bottom: 8px;">The Core Problem Solved</h4>
            <p style="font-size: 14px; color: var(--ink-soft); margin-bottom: 0;">${arch.problem}</p>
          </div>
          <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line);">
            <h4 style="color: var(--success); margin-bottom: 8px;">When To Deploy This Architecture</h4>
            <p style="font-size: 14px; color: var(--ink-soft); margin-bottom: 0;">${arch.whenToUse}</p>
          </div>
        </div>

        <div style="margin-top: 40px;">
          <h2>Architectural Components</h2>
          <ul style="margin-left: 20px; margin-top: 16px; font-size: 15px; color: var(--ink-soft);">
            ${arch.components.map(c => `<li style="margin-bottom: 10px;">${c}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-top: 40px;">
          <h2>Data Flow Narrative</h2>
          <div style="background: var(--wash); padding: 24px; border-left: 3px solid var(--ink); font-size: 15px; line-height: 1.7;">
            ${arch.dataFlow}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px;">
          <div>
            <h3>Security & Perimeter Control</h3>
            <p style="font-size: 14px; color: var(--muted); margin-top: 8px;">${arch.security}</p>
          </div>
          <div>
            <h3>Governance & Telemetry</h3>
            <p style="font-size: 14px; color: var(--muted); margin-top: 8px;">${arch.governance}</p>
          </div>
        </div>

        <div style="margin-top: 40px; background: #fff1f2; border: 1px solid #fecdd3; padding: 24px;">
          <h4 style="color: #9f1239; margin-bottom: 8px;">Identified Failure Modes & Mitigations</h4>
          <p style="font-size: 14px; color: #881337; margin-bottom: 0;">${arch.failureModes}</p>
        </div>

        <div style="margin-top: 48px; text-align: center;">
          <a href="/architectures/" class="btn btn-secondary">← Back to Architecture Library</a>
        </div>
      </article>
    `;

    const archHtml = renderHtmlPage({
      title: `${arch.title} | Bhavin Mistry`,
      description: arch.summary,
      canonicalUrl: `https://bhavinmistry.com/architectures/${arch.slug}/`,
      currentPath: `/architectures/${arch.slug}/`,
      mainContent: archMain,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": arch.title,
        "description": arch.summary,
        "author": { "@type": "Person", "name": "Bhavin Mistry" }
      }
    });

    fs.writeFileSync(path.join(archDir, 'index.html'), archHtml);
    console.log(`Generated: architectures/${arch.slug}/index.html`);
  });
}

// 4. Build Framework Page (enterprise-ai-production-readiness)
function buildFrameworks() {
  const fwDir = path.join(ROOT_DIR, 'frameworks/enterprise-ai-production-readiness');
  ensureDir(fwDir);

  const fw = content.frameworks.readiness;
  const fwMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Signature Methodology</span>
      <h1>${fw.title}</h1>
      <p class="hero-lead" style="max-width: 840px; margin-top: 16px; margin-bottom: 40px;">
        ${fw.description}
      </p>

      <div style="display: flex; gap: 16px; margin-bottom: 48px;">
        <a href="/tools/enterprise-ai-readiness/" class="btn btn-primary">Take 18-Question Readiness Assessment →</a>
        <a href="#matrix" class="btn btn-secondary">Jump to Maturity Matrix ↓</a>
      </div>

      <!-- 5 Stages Detail -->
      <h2 style="margin-bottom: 24px;">The 5 Stages of Production AI</h2>
      <div class="card-grid-4" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 48px;">
        ${fw.stages.map((st, idx) => `
          <div class="card" style="padding: 24px;">
            <span class="badge badge-accent" style="margin-bottom: 12px;">Stage 0${idx + 1}</span>
            <h3 style="font-size: 20px; margin-bottom: 8px;">${st.name}</h3>
            <div style="font-size: 11px; font-family: var(--mono); color: var(--muted); margin-bottom: 12px;">${st.tagline}</div>
            <p style="font-size: 13px; color: var(--muted); line-height: 1.6;">${st.focus}</p>
            <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line-subtle); font-size: 12px; color: var(--accent);">
              <strong>Exit Milestone:</strong><br>${st.milestone}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 12 Dimension Matrix -->
      <h2 id="matrix" style="margin-bottom: 16px;">The 12-Dimension Enterprise Maturity Matrix</h2>
      <p style="font-size: 14px; color: var(--muted); margin-bottom: 24px;">
        Benchmark your systems across all 12 operational disciplines before advancing between stages.
      </p>

      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th style="width: 15%;">Dimension</th>
              <th style="width: 17%;">01. Explore</th>
              <th style="width: 17%;">02. Validate</th>
              <th style="width: 17%;">03. Govern</th>
              <th style="width: 17%;">04. Productionise</th>
              <th style="width: 17%;">05. Scale</th>
            </tr>
          </thead>
          <tbody>
            ${fw.dimensions.map(d => `
              <tr>
                <td>${d.name}</td>
                <td>${d.explore}</td>
                <td>${d.validate}</td>
                <td>${d.govern}</td>
                <td>${d.productionise}</td>
                <td>${d.scale}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 48px; background: var(--wash); padding: 32px; border: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px;">
        <div>
          <h3 style="margin-bottom: 6px;">Benchmark Your Enterprise Score</h3>
          <p style="font-size: 14px; color: var(--muted); margin-bottom: 0;">Calculate your dimension scores across Strategy, Data, Engineering, Governance, and Operations.</p>
        </div>
        <a href="/tools/enterprise-ai-readiness/" class="btn btn-primary">Start Interactive Assessment →</a>
      </div>
    </div>
  `;

  const fwHtml = renderHtmlPage({
    title: "Enterprise AI Production Readiness Framework | Bhavin Mistry",
    description: "A 5-stage, 12-dimension enterprise maturity framework by Bhavin Mistry for taking generative AI and agentic systems from exploration to production.",
    canonicalUrl: "https://bhavinmistry.com/frameworks/enterprise-ai-production-readiness/",
    currentPath: "/frameworks/enterprise-ai-production-readiness/",
    mainContent: fwMain
  });

  fs.writeFileSync(path.join(fwDir, 'index.html'), fwHtml);
  console.log('Generated: frameworks/enterprise-ai-production-readiness/index.html');
}

// 5. Build AI Radar Page (/ai-radar/)
function buildRadar() {
  const radarDir = path.join(ROOT_DIR, 'ai-radar');
  ensureDir(radarDir);

  const radarMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Technology Tracking</span>
      <h1>Bhavin's Enterprise AI Radar</h1>
      <p class="hero-lead" style="max-width: 800px; margin-top: 16px; margin-bottom: 40px;">
        An opinionated, engineering-grounded evaluation of emerging AI technologies, frameworks, and tools categorized by enterprise production viability.
      </p>

      <!-- Quadrant Breakdown -->
      <div class="radar-grid" style="margin-bottom: 48px;">
        <div class="radar-column">
          <div class="radar-column-header">
            <h3 style="font-size: 18px; color: #166534;">ADOPT</h3>
            <span class="badge badge-adopt">Production Ready</span>
          </div>
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">Proven return, mature tooling, reliable security posture.</p>
          ${content.radar.filter(r => r.quadrant === 'ADOPT').map(item => `
            <div class="radar-item-card">
              <span class="eyebrow" style="font-size: 9px; margin-bottom: 4px;">${item.category}</span>
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 11px; color: var(--ink-soft); border-top: 1px solid var(--line-subtle); padding-top: 6px; margin-top: 6px;">
                <strong>Enterprise Rationale:</strong> ${item.rationale}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="radar-column">
          <div class="radar-column-header">
            <h3 style="font-size: 18px; color: #0369a1;">TRIAL</h3>
            <span class="badge badge-trial">Pilot & Verify</span>
          </div>
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">Strong potential, warrants targeted proof-of-concept testing.</p>
          ${content.radar.filter(r => r.quadrant === 'TRIAL').map(item => `
            <div class="radar-item-card">
              <span class="eyebrow" style="font-size: 9px; margin-bottom: 4px;">${item.category}</span>
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 11px; color: var(--ink-soft); border-top: 1px solid var(--line-subtle); padding-top: 6px; margin-top: 6px;">
                <strong>Enterprise Rationale:</strong> ${item.rationale}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="radar-column">
          <div class="radar-column-header">
            <h3 style="font-size: 18px; color: #92400e;">ASSESS</h3>
            <span class="badge badge-assess">Research Spike</span>
          </div>
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">Promising early architecture; understand constraints and edge cases.</p>
          ${content.radar.filter(r => r.quadrant === 'ASSESS').map(item => `
            <div class="radar-item-card">
              <span class="eyebrow" style="font-size: 9px; margin-bottom: 4px;">${item.category}</span>
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 11px; color: var(--ink-soft); border-top: 1px solid var(--line-subtle); padding-top: 6px; margin-top: 6px;">
                <strong>Enterprise Rationale:</strong> ${item.rationale}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="radar-column">
          <div class="radar-column-header">
            <h3 style="font-size: 18px; color: #6b21a8;">WATCH</h3>
            <span class="badge badge-watch">High Risk / Early</span>
          </div>
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">Monitor regulatory and safety implications; avoid unverified production use.</p>
          ${content.radar.filter(r => r.quadrant === 'WATCH').map(item => `
            <div class="radar-item-card">
              <span class="eyebrow" style="font-size: 9px; margin-bottom: 4px;">${item.category}</span>
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 11px; color: var(--ink-soft); border-top: 1px solid var(--line-subtle); padding-top: 6px; margin-top: 6px;">
                <strong>Enterprise Rationale:</strong> ${item.rationale}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const radarHtml = renderHtmlPage({
    title: "Enterprise AI Radar | Bhavin Mistry",
    description: "Technology radar tracking enterprise AI, hybrid RAG, coding agents, and autonomous systems across Adopt, Trial, Assess, and Watch tiers.",
    canonicalUrl: "https://bhavinmistry.com/ai-radar/",
    currentPath: "/ai-radar/",
    mainContent: radarMain
  });

  fs.writeFileSync(path.join(radarDir, 'index.html'), radarHtml);
  console.log('Generated: ai-radar/index.html');
}

// 6. Build Handbook Landing Page (/enterprise-ai-engineering/)
function buildHandbook() {
  const hbDir = path.join(ROOT_DIR, 'enterprise-ai-engineering');
  ensureDir(hbDir);

  const hb = content.handbook;
  const hbMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Flagship Knowledge Hub</span>
      <h1>${hb.title}</h1>
      <p class="hero-lead" style="max-width: 840px; margin-top: 16px; margin-bottom: 40px;">
        ${hb.description}
      </p>

      <div style="background: var(--wash); border-left: 3px solid var(--accent); padding: 24px 32px; margin-bottom: 48px;">
        <h4 style="margin-bottom: 6px;">Handbook Scope & Architecture</h4>
        <p style="font-size: 14px; color: var(--muted); margin-bottom: 0;">
          The Handbook is an evolving body of knowledge covering foundational distributed systems design, LLM gateway engineering, evaluation harnesses, security perimeters, and regulatory compliance.
        </p>
      </div>

      <div class="card-grid-3">
        ${hb.chapters.map(ch => `
          <div class="card" style="padding: 24px;">
            <span class="eyebrow" style="color: var(--accent); margin-bottom: 8px;">Chapter ${ch.number}</span>
            <h3 style="font-size: 19px; margin-bottom: 8px;">${ch.title}</h3>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">${ch.summary}</p>
            <div class="card-footer">
              <span class="badge">Reference Chapter</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const hbHtml = renderHtmlPage({
    title: "The Enterprise AI Engineering Handbook | Bhavin Mistry",
    description: "A 23-chapter practical field guide for CTOs, architects, and engineering leaders building, governing, and scaling production AI systems.",
    canonicalUrl: "https://bhavinmistry.com/enterprise-ai-engineering/",
    currentPath: "/enterprise-ai-engineering/",
    mainContent: hbMain
  });

  fs.writeFileSync(path.join(hbDir, 'index.html'), hbHtml);
  console.log('Generated: enterprise-ai-engineering/index.html');
}

// 7. Build Interactive Tools Hub & 5 Individual Calculators
function buildTools() {
  ensureDir(path.join(ROOT_DIR, 'tools'));

  // Main Tools Listing Page
  const toolsMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Decision Calculators</span>
      <h1>Enterprise AI Engineering & Financial Tools</h1>
      <p class="hero-lead" style="max-width: 800px; margin-top: 16px; margin-bottom: 40px;">
        Interactive decision models, financial calculators, and maturity assessments running client-side with transparent formulas.
      </p>

      <div class="card-grid-3">
        <div class="card">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Maturity Assessment</span>
          <h2><a href="/tools/enterprise-ai-readiness/">AI Readiness Diagnostic</a></h2>
          <p>18-question diagnostic assessing your enterprise across Strategy, Data, Engineering, Governance, and Operations.</p>
          <div class="card-footer">
            <a href="/tools/enterprise-ai-readiness/" class="text-link">Start Diagnostic <span>→</span></a>
          </div>
        </div>

        <div class="card">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Cost Modeling</span>
          <h2><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></h2>
          <p>Model monthly vector storage, embedding tokens, inference volume, and caching return across enterprise document pools.</p>
          <div class="card-footer">
            <a href="/tools/rag-cost-calculator/" class="text-link">Calculate RAG Cost <span>→</span></a>
          </div>
        </div>

        <div class="card">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Unit Economics</span>
          <h2><a href="/tools/llm-cost-calculator/">LLM Token Cost Estimator</a></h2>
          <p>Compute daily, monthly, and annualized inference budgets based on prompt/completion ratios and prompt cache hits.</p>
          <div class="card-footer">
            <a href="/tools/llm-cost-calculator/" class="text-link">Estimate Tokens <span>→</span></a>
          </div>
        </div>

        <div class="card">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Portfolio Strategy</span>
          <h2><a href="/tools/ai-use-case-prioritiser/">AI Use Case Prioritiser</a></h2>
          <p>Map candidate AI initiatives into Quick Wins, Strategic Bets, Experiments, or Defer based on business value and risk.</p>
          <div class="card-footer">
            <a href="/tools/ai-use-case-prioritiser/" class="text-link">Prioritise Use Cases <span>→</span></a>
          </div>
        </div>

        <div class="card">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Platform Decisions</span>
          <h2><a href="/tools/build-vs-buy-ai-platform/">Build vs Buy Calculator</a></h2>
          <p>Weighted 10-criteria decision framework evaluating whether to license a commercial AI platform or build internal tooling.</p>
          <div class="card-footer">
            <a href="/tools/build-vs-buy-ai-platform/" class="text-link">Evaluate Platform <span>→</span></a>
          </div>
        </div>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(ROOT_DIR, 'tools/index.html'), renderHtmlPage({
    title: "Enterprise AI Decision Tools & Calculators | Bhavin Mistry",
    description: "Client-side calculators for RAG costs, LLM tokens, AI readiness assessment, use case prioritization, and build vs buy evaluations.",
    canonicalUrl: "https://bhavinmistry.com/tools/",
    currentPath: "/tools/",
    mainContent: toolsMain
  }));
  console.log('Generated: tools/index.html');

  // Tool 1: Enterprise AI Readiness Assessment
  const readinessDir = path.join(ROOT_DIR, 'tools/enterprise-ai-readiness');
  ensureDir(readinessDir);
  const readinessMain = `
    <div class="container" style="max-width: 840px; padding-top: 64px; padding-bottom: 88px;">
      <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
        <a href="/">Home</a> / <a href="/tools/">Tools</a> / <span style="color: var(--ink);">AI Readiness Assessment</span>
      </nav>

      <span class="eyebrow">Interactive Diagnostic</span>
      <h1>Enterprise AI Readiness Assessment</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Evaluate your organization's readiness for production AI across Strategy, Data, Engineering, Governance, and Operations.
      </p>

      <form id="readiness-assessment-form" style="background: var(--paper-elevated); padding: 36px; border: 1px solid var(--line);">
        <!-- Strategy -->
        <div class="quiz-step">
          <span class="eyebrow">01. Strategy & ROI</span>
          <h4>How are GenAI investments tied to business outcomes?</h4>
          <div class="quiz-options">
            <label class="quiz-option"><input type="radio" name="q1" value="1" data-dim="strategy" required> Informal interest; exploratory hobbyist demos.</label>
            <label class="quiz-option"><input type="radio" name="q1" value="3" data-dim="strategy"> Business case drafted with defined efficiency KPI targets.</label>
            <label class="quiz-option"><input type="radio" name="q1" value="5" data-dim="strategy"> Executive sponsor assigned, tied to quarterly P&L margin outcomes.</label>
          </div>
        </div>

        <div class="quiz-step">
          <span class="eyebrow">02. Data Readiness</span>
          <h4>How are enterprise knowledge sources curated and accessed?</h4>
          <div class="quiz-options">
            <label class="quiz-option"><input type="radio" name="q2" value="1" data-dim="data" required> Raw unorganized PDFs and wiki pages scattered across SharePoint.</label>
            <label class="quiz-option"><input type="radio" name="q2" value="3" data-dim="data"> Curated knowledge stores with basic metadata and chunking pipelines.</label>
            <label class="quiz-option"><input type="radio" name="q2" value="5" data-dim="data"> Automated ETL pipelines with document-level RBAC sync and freshness triggers.</label>
          </div>
        </div>

        <div class="quiz-step">
          <span class="eyebrow">03. Engineering Maturity</span>
          <h4>How is AI software delivered and deployed?</h4>
          <div class="quiz-options">
            <label class="quiz-option"><input type="radio" name="q3" value="1" data-dim="engineering" required> Python notebooks or ad-hoc scripts with hardcoded API keys.</label>
            <label class="quiz-option"><input type="radio" name="q3" value="3" data-dim="engineering"> Version-controlled repositories with CI linting and containerization.</label>
            <label class="quiz-option"><input type="radio" name="q3" value="5" data-dim="engineering"> Automated CI/CD pipelines with canary rollouts and automated rollback triggers.</label>
          </div>
        </div>

        <div class="quiz-step">
          <span class="eyebrow">04. AI Governance & Security</span>
          <h4>What security and risk controls are enforced?</h4>
          <div class="quiz-options">
            <label class="quiz-option"><input type="radio" name="q4" value="1" data-dim="governance" required> No formal review; relying solely on vendor terms of service.</label>
            <label class="quiz-option"><input type="radio" name="q4" value="3" data-dim="governance"> Risk triage completed; basic PII redaction and secret scanning in place.</label>
            <label class="quiz-option"><input type="radio" name="q4" value="5" data-dim="governance"> Formal InfoSec & APRA CPS 234 review, zero data retention, and trace logging.</label>
          </div>
        </div>

        <div class="quiz-step">
          <span class="eyebrow">05. Production Operations</span>
          <h4>How are live systems monitored and evaluated?</h4>
          <div class="quiz-options">
            <label class="quiz-option"><input type="radio" name="q5" value="1" data-dim="operations" required> Vibe checks and manual user bug reports in Slack.</label>
            <label class="quiz-option"><input type="radio" name="q5" value="3" data-dim="operations"> Golden evaluation test set (>100 Q&As) run in CI before merges.</label>
            <label class="quiz-option"><input type="radio" name="q5" value="5" data-dim="operations"> Full OpenTelemetry tracing, LLM-as-a-judge sampling, and on-call runbooks.</label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 15px;">Calculate Readiness Score →</button>
      </form>

      <!-- RESULTS CONTAINER -->
      <div id="assessment-results" style="display: none; margin-top: 40px; background: var(--wash); border: 1px solid var(--line); padding: 36px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--line); padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <span class="eyebrow">Assessment Outcome</span>
            <h3 style="font-size: 28px;">Overall Readiness: <span id="res-overall-score" style="color: var(--accent);">-- / 100</span></h3>
          </div>
          <span id="res-stage" class="badge badge-accent" style="font-size: 13px; padding: 6px 12px;">STAGE</span>
        </div>
        <p id="res-summary" style="font-size: 15px; color: var(--ink-soft); margin-bottom: 24px; line-height: 1.6;"></p>

        <h4 style="margin-bottom: 12px;">Dimension Breakdown</h4>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: var(--paper); padding: 12px; text-align: center; border: 1px solid var(--line);">
            <div style="font-size: 10px; font-family: var(--mono); color: var(--muted);">STRATEGY</div>
            <div id="res-strategy" style="font-size: 18px; font-weight: 600; margin-top: 4px;">--</div>
          </div>
          <div style="background: var(--paper); padding: 12px; text-align: center; border: 1px solid var(--line);">
            <div style="font-size: 10px; font-family: var(--mono); color: var(--muted);">DATA</div>
            <div id="res-data" style="font-size: 18px; font-weight: 600; margin-top: 4px;">--</div>
          </div>
          <div style="background: var(--paper); padding: 12px; text-align: center; border: 1px solid var(--line);">
            <div style="font-size: 10px; font-family: var(--mono); color: var(--muted);">ENGINEERING</div>
            <div id="res-engineering" style="font-size: 18px; font-weight: 600; margin-top: 4px;">--</div>
          </div>
          <div style="background: var(--paper); padding: 12px; text-align: center; border: 1px solid var(--line);">
            <div style="font-size: 10px; font-family: var(--mono); color: var(--muted);">GOVERNANCE</div>
            <div id="res-governance" style="font-size: 18px; font-weight: 600; margin-top: 4px;">--</div>
          </div>
          <div style="background: var(--paper); padding: 12px; text-align: center; border: 1px solid var(--line);">
            <div style="font-size: 10px; font-family: var(--mono); color: var(--muted);">OPERATIONS</div>
            <div id="res-operations" style="font-size: 18px; font-weight: 600; margin-top: 4px;">--</div>
          </div>
        </div>

        <button id="print-assessment-btn" type="button" class="btn btn-secondary" style="width: 100%;">Print Assessment Report 🖨</button>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(readinessDir, 'index.html'), renderHtmlPage({
    title: "Enterprise AI Readiness Assessment Tool | Bhavin Mistry",
    description: "Benchmark your enterprise AI maturity across Strategy, Data, Engineering, Governance, and Operations with an interactive diagnostic.",
    canonicalUrl: "https://bhavinmistry.com/tools/enterprise-ai-readiness/",
    currentPath: "/tools/enterprise-ai-readiness/",
    mainContent: readinessMain
  }));
  console.log('Generated: tools/enterprise-ai-readiness/index.html');

  // Tool 2: RAG Cost Calculator
  const ragDir = path.join(ROOT_DIR, 'tools/rag-cost-calculator');
  ensureDir(ragDir);
  const ragMain = `
    <div class="container" style="max-width: 960px; padding-top: 64px; padding-bottom: 88px;">
      <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
        <a href="/">Home</a> / <a href="/tools/">Tools</a> / <span style="color: var(--ink);">RAG Cost Calculator</span>
      </nav>

      <span class="eyebrow">Financial Modeling</span>
      <h1>Enterprise RAG Cost Calculator</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Model vector search inference, embedding volumes, chunk sizes, and semantic cache savings with transparent calculations.
      </p>

      <div class="tool-layout">
        <form id="rag-calculator-form" class="tool-form">
          <div class="form-group">
            <label for="rag-queries">Monthly User Queries <span class="form-help">Total retrieval queries</span></label>
            <input type="number" id="rag-queries" class="form-input" value="100000" step="5000" />
          </div>
          <div class="form-group">
            <label for="rag-input-tokens">User Question Tokens <span class="form-help">Average prompt query size</span></label>
            <input type="number" id="rag-input-tokens" class="form-input" value="150" />
          </div>
          <div class="form-group">
            <label for="rag-output-tokens">LLM Response Tokens <span class="form-help">Generated answer tokens</span></label>
            <input type="number" id="rag-output-tokens" class="form-input" value="400" />
          </div>
          <div class="form-group">
            <label for="rag-chunks">Retrieved Chunks Per Query <span class="form-help">Top-K passages retrieved</span></label>
            <input type="number" id="rag-chunks" class="form-input" value="5" />
          </div>
          <div class="form-group">
            <label for="rag-chunk-tokens">Tokens Per Chunk <span class="form-help">Average chunk size</span></label>
            <input type="number" id="rag-chunk-tokens" class="form-input" value="500" />
          </div>
          <div class="form-group">
            <label for="rag-llm-input-price">LLM Input Price ($/1M tokens) <span class="form-help">e.g. $3.00 (Claude 3.5 Sonnet)</span></label>
            <input type="number" id="rag-llm-input-price" class="form-input" value="3.0" step="0.5" />
          </div>
          <div class="form-group">
            <label for="rag-llm-output-price">LLM Output Price ($/1M tokens) <span class="form-help">e.g. $15.00</span></label>
            <input type="number" id="rag-llm-output-price" class="form-input" value="15.0" step="1.0" />
          </div>
          <div class="form-group">
            <label for="rag-embed-price">Embedding Price ($/1M tokens) <span class="form-help">e.g. $0.02 (text-embedding-3-small)</span></label>
            <input type="number" id="rag-embed-price" class="form-input" value="0.02" step="0.01" />
          </div>
          <div class="form-group">
            <label for="rag-cache-rate">Semantic Cache Hit Rate (%) <span class="form-help">Cached query hits</span></label>
            <input type="number" id="rag-cache-rate" class="form-input" value="25" min="0" max="95" />
          </div>
        </form>

        <div class="tool-output">
          <div>
            <div class="output-stat">
              <div class="output-label">Estimated Monthly RAG Cost</div>
              <div id="out-rag-month" class="output-num">$0.00</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Estimated Cost Per Query</div>
              <div id="out-rag-query" class="output-num" style="font-size: 26px;">$0.0000</div>
            </div>
            <div class="output-stat">
              <div class="output-label">LLM Context Generation Portion</div>
              <div id="out-rag-llm" style="font-size: 18px; font-weight: 600; color: var(--ink-soft);">$0.00</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Estimated Cache Savings / Mo</div>
              <div id="out-rag-savings" style="font-size: 18px; font-weight: 600; color: var(--success);">$0.00</div>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 16px;">
            Assumes standard reciprocal rank fusion and vector embedding lookup per query. Model prices are editable to reflect your enterprise agreements.
          </div>
        </div>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(ragDir, 'index.html'), renderHtmlPage({
    title: "Enterprise RAG Cost Calculator | Bhavin Mistry",
    description: "Calculate monthly inference, embedding, and vector search costs for enterprise retrieval-augmented generation applications.",
    canonicalUrl: "https://bhavinmistry.com/tools/rag-cost-calculator/",
    currentPath: "/tools/rag-cost-calculator/",
    mainContent: ragMain
  }));
  console.log('Generated: tools/rag-cost-calculator/index.html');

  // Tool 3: LLM Cost Calculator
  const llmDir = path.join(ROOT_DIR, 'tools/llm-cost-calculator');
  ensureDir(llmDir);
  const llmMain = `
    <div class="container" style="max-width: 960px; padding-top: 64px; padding-bottom: 88px;">
      <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
        <a href="/">Home</a> / <a href="/tools/">Tools</a> / <span style="color: var(--ink);">LLM Cost Calculator</span>
      </nav>

      <span class="eyebrow">Unit Economics</span>
      <h1>LLM Token Cost Estimator</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Transparent unit economic projection across requests, token volumes, prompt cache hits, and annualized budgets.
      </p>

      <div class="tool-layout">
        <form id="llm-calculator-form" class="tool-form">
          <div class="form-group">
            <label for="llm-requests">Inference Requests Per Day</label>
            <input type="number" id="llm-requests" class="form-input" value="10000" step="500" />
          </div>
          <div class="form-group">
            <label for="llm-input-tokens">Average Input Tokens / Request</label>
            <input type="number" id="llm-input-tokens" class="form-input" value="1500" />
          </div>
          <div class="form-group">
            <label for="llm-output-tokens">Average Output Tokens / Request</label>
            <input type="number" id="llm-output-tokens" class="form-input" value="500" />
          </div>
          <div class="form-group">
            <label for="llm-input-price">Input Token Price ($ / 1M tokens)</label>
            <input type="number" id="llm-input-price" class="form-input" value="3.0" step="0.25" />
          </div>
          <div class="form-group">
            <label for="llm-output-price">Output Token Price ($ / 1M tokens)</label>
            <input type="number" id="llm-output-price" class="form-input" value="15.0" step="0.5" />
          </div>
          <div class="form-group">
            <label for="llm-cache-hit">Prompt Cache Hit Ratio (%)</label>
            <input type="number" id="llm-cache-hit" class="form-input" value="30" min="0" max="95" />
          </div>
          <div class="form-group">
            <label for="llm-days-month">Operating Days Per Month</label>
            <input type="number" id="llm-days-month" class="form-input" value="30" />
          </div>
        </form>

        <div class="tool-output">
          <div>
            <div class="output-stat">
              <div class="output-label">Cost Per Single Request</div>
              <div id="out-cost-request" class="output-num" style="font-size: 28px;">$0.0000</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Estimated Daily Spend</div>
              <div id="out-cost-day" class="output-num" style="font-size: 32px;">$0.00</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Estimated Monthly Spend</div>
              <div id="out-cost-month" class="output-num">$0.00</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Annualized Run-Rate</div>
              <div id="out-cost-annual" style="font-size: 22px; font-weight: 600; color: var(--accent);">$0.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(llmDir, 'index.html'), renderHtmlPage({
    title: "LLM Token Cost Calculator | Bhavin Mistry",
    description: "Estimate daily, monthly, and annualized LLM token inference costs with customizable prompt caching rates.",
    canonicalUrl: "https://bhavinmistry.com/tools/llm-cost-calculator/",
    currentPath: "/tools/llm-cost-calculator/",
    mainContent: llmMain
  }));
  console.log('Generated: tools/llm-cost-calculator/index.html');

  // Tool 4: AI Use Case Prioritiser
  const priorDir = path.join(ROOT_DIR, 'tools/ai-use-case-prioritiser');
  ensureDir(priorDir);
  const priorMain = `
    <div class="container" style="max-width: 960px; padding-top: 64px; padding-bottom: 88px;">
      <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
        <a href="/">Home</a> / <a href="/tools/">Tools</a> / <span style="color: var(--ink);">AI Use Case Prioritiser</span>
      </nav>

      <span class="eyebrow">Portfolio Governance</span>
      <h1>AI Use Case Prioritiser Matrix</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Evaluate candidate AI initiatives across business value, technical complexity, risk, and regulatory impact.
      </p>

      <div class="tool-layout">
        <form id="prioritiser-form" class="tool-form">
          <div class="form-group">
            <label for="p-biz-val">Business Value (1–10) <span class="form-help">Cost reduction or revenue lift</span></label>
            <input type="range" id="p-biz-val" min="1" max="10" value="8" />
          </div>
          <div class="form-group">
            <label for="p-cust-val">Customer / User Impact (1–10)</label>
            <input type="range" id="p-cust-val" min="1" max="10" value="7" />
          </div>
          <div class="form-group">
            <label for="p-complexity">Implementation Complexity (1–10) <span class="form-help">Data pipelines, systems integration</span></label>
            <input type="range" id="p-complexity" min="1" max="10" value="4" />
          </div>
          <div class="form-group">
            <label for="p-risk">Risk & Regulatory Impact (1–10) <span class="form-help">APRA compliance, hallucinations</span></label>
            <input type="range" id="p-risk" min="1" max="10" value="4" />
          </div>
        </form>

        <div class="tool-output">
          <div>
            <div class="output-stat">
              <div class="output-label">Matrix Recommendation</div>
              <div style="margin-top: 8px;"><span id="out-priority-badge" class="badge badge-adopt" style="font-size: 14px; padding: 6px 12px;">QUICK WINS</span></div>
              <div id="out-priority-quad" class="output-num" style="font-size: 26px; margin-top: 12px;">QUICK WINS</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Strategic Guidance</div>
              <p id="out-priority-rec" style="font-size: 14px; color: var(--ink-soft); line-height: 1.6; margin-top: 8px;">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(priorDir, 'index.html'), renderHtmlPage({
    title: "AI Use Case Prioritiser Matrix | Bhavin Mistry",
    description: "Map candidate enterprise AI initiatives into Quick Wins, Strategic Bets, Experiments, or Defer.",
    canonicalUrl: "https://bhavinmistry.com/tools/ai-use-case-prioritiser/",
    currentPath: "/tools/ai-use-case-prioritiser/",
    mainContent: priorMain
  }));
  console.log('Generated: tools/ai-use-case-prioritiser/index.html');

  // Tool 5: Build vs Buy AI Platform Calculator
  const bvbDir = path.join(ROOT_DIR, 'tools/build-vs-buy-ai-platform');
  ensureDir(bvbDir);
  const bvbMain = `
    <div class="container" style="max-width: 960px; padding-top: 64px; padding-bottom: 88px;">
      <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
        <a href="/">Home</a> / <a href="/tools/">Tools</a> / <span style="color: var(--ink);">Build vs Buy Calculator</span>
      </nav>

      <span class="eyebrow">Platform Architecture</span>
      <h1>Build vs Buy AI Platform Calculator</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        A weighted decision framework to determine whether to license a commercial AI platform or invest in custom internal platform engineering.
      </p>

      <div class="tool-layout">
        <form id="bvb-form" class="tool-form">
          <div class="form-group">
            <label for="bvb-eng-cap">In-House Engineering Capability (1–10)</label>
            <input type="range" id="bvb-eng-cap" min="1" max="10" value="6" />
          </div>
          <div class="form-group">
            <label for="bvb-team-size">Engineering Team Size Consuming AI (1–10)</label>
            <input type="range" id="bvb-team-size" min="1" max="10" value="7" />
          </div>
          <div class="form-group">
            <label for="bvb-custom">Custom Integration / Proprietary Needs (1–10)</label>
            <input type="range" id="bvb-custom" min="1" max="10" value="6" />
          </div>
          <div class="form-group">
            <label for="bvb-compliance">Regulatory & Data Sovereignty Constraints (1–10)</label>
            <input type="range" id="bvb-compliance" min="1" max="10" value="8" />
          </div>
          <div class="form-group">
            <label for="bvb-time">Urgency & Time-to-Market Pressure (1–10)</label>
            <input type="range" id="bvb-time" min="1" max="10" value="5" />
          </div>
        </form>

        <div class="tool-output">
          <div>
            <div class="output-stat">
              <div class="output-label">Build Affinity Score</div>
              <div id="out-bvb-score" class="output-num">-- / 100</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Architectural Recommendation</div>
              <div id="out-bvb-verdict" style="font-size: 18px; font-weight: 600; color: var(--accent); margin-top: 6px;">--</div>
            </div>
            <div class="output-stat">
              <div class="output-label">Rationale</div>
              <p id="out-bvb-rationale" style="font-size: 13px; color: var(--ink-soft); line-height: 1.6; margin-top: 6px;">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(bvbDir, 'index.html'), renderHtmlPage({
    title: "Build vs Buy AI Platform Calculator | Bhavin Mistry",
    description: "Weighted 10-criteria decision framework evaluating whether to license commercial AI tooling or construct an in-house AI platform.",
    canonicalUrl: "https://bhavinmistry.com/tools/build-vs-buy-ai-platform/",
    currentPath: "/tools/build-vs-buy-ai-platform/",
    mainContent: bvbMain
  }));
  console.log('Generated: tools/build-vs-buy-ai-platform/index.html');
}

// 8. Build Research Hub (/research/)
function buildResearch() {
  const resDir = path.join(ROOT_DIR, 'research');
  ensureDir(resDir);

  const resMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Original Research</span>
      <h1>Enterprise AI Research & Benchmarks</h1>
      <p class="hero-lead" style="max-width: 800px; margin-top: 16px; margin-bottom: 40px;">
        Empirical benchmarks, production metrics, and industry studies tracking real enterprise AI outcomes.
      </p>

      <div class="card-grid-3">
        ${content.research.map(r => `
          <div class="card">
            <div class="card-meta">
              <span class="badge badge-accent">${r.status}</span>
              <span style="font-family: var(--mono); font-size: 11px;">${r.date}</span>
            </div>
            <h3>${r.title}</h3>
            <p>${r.summary}</p>
            <div style="border-top: 1px solid var(--line-subtle); padding-top: 16px; margin-top: auto;">
              <span class="eyebrow" style="margin-bottom: 6px;">Focus Areas</span>
              <ul style="font-size: 12px; color: var(--muted); margin-left: 16px;">
                ${r.focus.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 64px; background: var(--wash); padding: 36px; border: 1px solid var(--line);">
        <h3>Research Methodology & Standards</h3>
        <p style="font-size: 14px; color: var(--muted); line-height: 1.7; margin-top: 12px;">
          All research published under Bhavin Mistry adheres to strict empirical verification: datasets are reproducible, assumptions are documented, and commercial biases are eliminated. We do not publish fabricated survey statistics or synthetic benchmark numbers.
        </p>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(resDir, 'index.html'), renderHtmlPage({
    title: "Enterprise AI Research & Benchmarks | Bhavin Mistry",
    description: "Empirical benchmarks and research studies on enterprise RAG accuracy, LLM unit economics, and AI engineering productivity.",
    canonicalUrl: "https://bhavinmistry.com/research/",
    currentPath: "/research/",
    mainContent: resMain
  }));
  console.log('Generated: research/index.html');
}

// 9. Build About Page (/about/)
function buildAbout() {
  const abDir = path.join(ROOT_DIR, 'about');
  ensureDir(abDir);

  const abMain = `
    <div class="container" style="max-width: 880px; padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Personal Entity</span>
      <h1>About Bhavin Mistry</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        AI Strategy and Engineering Leader based in Melbourne, Australia.
      </p>

      <div style="font-size: 17px; line-height: 1.75; color: var(--ink-soft); margin-bottom: 48px;">
        <p>
          I help technology leaders turn artificial intelligence ambition into resilient, measurable enterprise software. My background bridges the space between high-level executive AI strategy, complex systems architecture, and the hands-on realities of engineering delivery.
        </p>
        <p>
          Much of my focus centers on financial services, where governance, regulatory compliance (such as APRA CPS 234), data sovereignty, and non-negotiable security controls belong in the design from the very first architectural spike.
        </p>
      </div>

      <!-- Core Disciplines -->
      <h2>Areas of Focus & Research</h2>
      <div class="card-grid-2" style="margin-top: 24px; margin-bottom: 48px;">
        <div class="card" style="padding: 24px;">
          <h4 style="margin-bottom: 8px;">Enterprise AI & Hybrid RAG</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Designing hybrid sparse-dense retrieval architectures, reciprocal rank fusion, and permission-aware security trimming across enterprise knowledge silos.
          </p>
        </div>
        <div class="card" style="padding: 24px;">
          <h4 style="margin-bottom: 8px;">Agentic Systems & Reliability</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Moving beyond fragile multi-agent demos to constrained state machines, deterministic guardrails, and cryptographic approval gates.
          </p>
        </div>
        <div class="card" style="padding: 24px;">
          <h4 style="margin-bottom: 8px;">AI-Enabled SDLC & Productivity</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Integrating CLI coding agents, automated PR code review bots, and synthetic evaluation harnesses to accelerate developer velocity safely.
          </p>
        </div>
        <div class="card" style="padding: 24px;">
          <h4 style="margin-bottom: 8px;">Governance & FinOps</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Implementing centralized LLM routing gateways, semantic caching, token attribution ledgers, and automated regulatory compliance reporting.
          </p>
        </div>
      </div>

      <!-- Verified Education -->
      <h2>Verified Education</h2>
      <div style="background: var(--paper-elevated); padding: 32px; border: 1px solid var(--line); margin-top: 20px; margin-bottom: 48px;">
        <span class="eyebrow" style="margin-bottom: 6px;">Executive Education</span>
        <h3 style="font-size: 22px; margin-bottom: 6px;">The University of Texas at Austin</h3>
        <p style="font-size: 15px; color: var(--ink-soft); margin-bottom: 4px;">Post Graduate Program in Artificial Intelligence and Machine Learning: Business Applications</p>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">Focused on business applications, deep learning architectures, and strategic enterprise AI deployment.</p>
      </div>

      <!-- Verified Profiles & Links -->
      <h2>Official Profiles & Contact</h2>
      <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-top: 20px;">
        <a href="https://www.linkedin.com/in/bhavin-mistry/" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Connect on LinkedIn ↗</a>
        <a href="https://medium.com/@bhavin_mistry" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Read on Medium ↗</a>
        <a href="https://learnaiengineering.dev/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Learn AI Engineering ↗</a>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(abDir, 'index.html'), renderHtmlPage({
    title: "About Bhavin Mistry | Enterprise AI Leader & Architect",
    description: "Verified profile of Bhavin Mistry, AI Strategy and Engineering Leader based in Melbourne, Australia. Background, education from UT Austin, and core focus areas.",
    canonicalUrl: "https://bhavinmistry.com/about/",
    currentPath: "/about/",
    mainContent: abMain,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": "Bhavin Mistry",
        "jobTitle": "AI Strategy and Engineering Leader",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Melbourne",
          "addressRegion": "Victoria",
          "addressCountry": "AU"
        },
        "alumniOf": {
          "@type": "CollegeOrUniversity",
          "name": "The University of Texas at Austin"
        },
        "sameAs": [
          "https://www.linkedin.com/in/bhavin-mistry/",
          "https://medium.com/@bhavin_mistry"
        ]
      }
    }
  }));
  console.log('Generated: about/index.html');
}

// 10. Build Newsletter (/newsletter/)
function buildNewsletter() {
  const nlDir = path.join(ROOT_DIR, 'newsletter');
  ensureDir(nlDir);

  const nlMain = `
    <div class="container" style="max-width: 720px; padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Fortnightly Briefing</span>
      <h1>Enterprise AI Brief</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Practical perspectives on Enterprise AI, Agentic Systems, and Engineering Leadership delivered directly to your inbox.
      </p>

      <div style="background: var(--paper-elevated); padding: 40px; border: 1px solid var(--line);">
        <h3 style="margin-bottom: 12px;">What You Receive</h3>
        <ul style="font-size: 14px; color: var(--muted); margin-left: 20px; margin-bottom: 32px; line-height: 1.7;">
          <li><strong>Production Blueprints:</strong> Real architectural patterns that have survived security and SLA reviews.</li>
          <li><strong>Bhavin's Take:</strong> Analytical commentary on major AI model releases, avoiding marketing hype.</li>
          <li><strong>FinOps & Reliability:</strong> Practical token unit economics, semantic caching techniques, and CI evaluation strategies.</li>
        </ul>

        <form action="/newsletter/" method="get" onsubmit="event.preventDefault(); alert('Thank you for subscribing! Subscriptions are queued. A confirmation email will arrive shortly.');">
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="sub-email">Your Work Email</label>
            <input type="email" id="sub-email" class="form-input" placeholder="name@enterprise.com" required style="width: 100%;" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 14px;">Subscribe Free to the Brief →</button>
        </form>
        <p style="font-size: 11px; color: var(--muted); margin-top: 16px; text-align: center;">
          Zero spam. Unsubscribe anytime with a single click. Respects your <a href="/privacy/" style="text-decoration: underline;">privacy</a>.
        </p>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(nlDir, 'index.html'), renderHtmlPage({
    title: "Enterprise AI Brief Newsletter | Bhavin Mistry",
    description: "Subscribe to the Enterprise AI Brief for practical perspectives on generative AI, agentic systems, and engineering leadership by Bhavin Mistry.",
    canonicalUrl: "https://bhavinmistry.com/newsletter/",
    currentPath: "/newsletter/",
    mainContent: nlMain
  }));
  console.log('Generated: newsletter/index.html');
}

// 11. Build Privacy Page (/privacy/)
function buildPrivacy() {
  const prDir = path.join(ROOT_DIR, 'privacy');
  ensureDir(prDir);

  const prMain = `
    <div class="container" style="max-width: 800px; padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Transparency</span>
      <h1>Privacy Policy</h1>
      <p style="font-size: 14px; color: var(--muted); margin-top: 8px; margin-bottom: 32px;">Last updated: September 2026</p>

      <div style="font-size: 15px; line-height: 1.7; color: var(--ink-soft);">
        <p>
          BhavinMistry.com is designed with privacy-first engineering principles. We respect your attention and do not track users across the web or sell personal data.
        </p>

        <h3 style="margin-top: 32px; margin-bottom: 12px;">1. What Information Is Collected</h3>
        <p>
          <strong>Interactive Tools & Calculators:</strong> All inputs to our calculators (RAG Cost, LLM Cost, Readiness Diagnostic, Use Case Prioritiser, Build vs Buy) are processed exclusively in your local browser memory using client-side JavaScript. No enterprise numbers or parameters are dispatched to external servers.
        </p>
        <p>
          <strong>Newsletter Subscriptions:</strong> If you voluntarily enter your email to subscribe to the <em>Enterprise AI Brief</em>, your address is stored securely with our email delivery provider solely to deliver the newsletter.
        </p>

        <h3 style="margin-top: 32px; margin-bottom: 12px;">2. Analytics & Cookies</h3>
        <p>
          This website uses minimal, privacy-conscious logging to understand aggregated readership trends without tracking individual identities or installing invasive third-party advertising cookies.
        </p>

        <h3 style="margin-top: 32px; margin-bottom: 12px;">3. Contact</h3>
        <p>
          If you have questions regarding this privacy policy, you can contact Bhavin via his verified <a href="https://www.linkedin.com/in/bhavin-mistry/" target="_blank" rel="noopener noreferrer">LinkedIn profile</a>.
        </p>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(prDir, 'index.html'), renderHtmlPage({
    title: "Privacy Policy | Bhavin Mistry",
    description: "Privacy policy for BhavinMistry.com detailing client-side calculation privacy, newsletter handling, and zero-tracking commitment.",
    canonicalUrl: "https://bhavinmistry.com/privacy/",
    currentPath: "/privacy/",
    mainContent: prMain
  }));
  console.log('Generated: privacy/index.html');
}

// 12. Build 404 Page (404.html)
function build404() {
  const notFoundMain = `
    <div class="container" style="max-width: 680px; padding-top: 80px; padding-bottom: 88px; text-align: center;">
      <span class="eyebrow" style="color: var(--accent);">Error 404</span>
      <h1 style="font-size: 48px; margin-top: 8px; margin-bottom: 16px;">Resource Not Located.</h1>
      <p style="font-size: 16px; color: var(--muted); margin-bottom: 32px;">
        The page you requested may have moved or been updated as part of our platform architecture migration.
      </p>

      <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 48px;">
        <a href="/" class="btn btn-primary">Return to Homepage</a>
        <a href="/insights/" class="btn btn-secondary">Explore Insights</a>
        <a href="/architectures/" class="btn btn-secondary">Architecture Library</a>
      </div>

      <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line); text-align: left;">
        <h4 style="margin-bottom: 8px;">Looking for something specific?</h4>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">Press <kbd style="background: var(--wash); border: 1px solid var(--line); padding: 2px 6px;">⌘K</kbd> anywhere on the site to trigger the Command Palette search.</p>
        <button type="button" class="btn btn-secondary search-trigger" style="width: 100%;">Open Quick Search 🔍</button>
      </div>
    </div>
  `;

  fs.writeFileSync(path.join(ROOT_DIR, '404.html'), renderHtmlPage({
    title: "404 Page Not Found | Bhavin Mistry",
    description: "The requested resource could not be found on BhavinMistry.com.",
    canonicalUrl: "https://bhavinmistry.com/404.html",
    currentPath: "/404",
    mainContent: notFoundMain
  }));
  console.log('Generated: 404.html');
}

// 13. Build Sitemap (sitemap.xml) & Robots (robots.txt) & RSS Feed (feed.xml) & llms.txt
function buildSeoAssets() {
  const routes = [
    '',
    'about/',
    'insights/',
    'enterprise-ai-engineering/',
    'architectures/',
    'frameworks/enterprise-ai-production-readiness/',
    'ai-radar/',
    'tools/',
    'tools/enterprise-ai-readiness/',
    'tools/rag-cost-calculator/',
    'tools/llm-cost-calculator/',
    'tools/ai-use-case-prioritiser/',
    'tools/build-vs-buy-ai-platform/',
    'research/',
    'newsletter/',
    'privacy/'
  ];

  content.insights.forEach(p => routes.push(`insights/${p.slug}/`));
  content.architectures.forEach(a => routes.push(`architectures/${a.slug}/`));

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>https://bhavinmistry.com/${r}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${r === '' ? '1.0' : (r.startsWith('insights/') || r.startsWith('architectures/') ? '0.9' : '0.8')}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml);
  console.log('Generated: sitemap.xml');

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /scratch/
Disallow: /data/

Sitemap: https://bhavinmistry.com/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt);
  console.log('Generated: robots.txt');

  // RSS feed (feed.xml)
  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bhavin Mistry | Enterprise AI Insights</title>
    <link>https://bhavinmistry.com/insights/</link>
    <description>Practical frameworks, architectures, and perspectives on Enterprise AI, AI Engineering, and Agentic Systems by Bhavin Mistry.</description>
    <language>en</language>
    <atom:link href="https://bhavinmistry.com/feed.xml" rel="self" type="application/rss+xml" />
    ${content.insights.map(p => `
    <item>
      <title>${p.title}</title>
      <link>https://bhavinmistry.com/insights/${p.slug}/</link>
      <guid>https://bhavinmistry.com/insights/${p.slug}/</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${p.summary}]]></description>
      <category>${p.category}</category>
    </item>`).join('')}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(ROOT_DIR, 'feed.xml'), feedXml);
  console.log('Generated: feed.xml');

  // llms.txt
  const llmsTxt = `# Bhavin Mistry - Enterprise AI Engineering Authority Platform
> Building Enterprise AI That Actually Reaches Production

## Author & Entity
- Name: Bhavin Mistry
- Focus: Enterprise AI, AI Engineering, Agentic AI, Enterprise RAG, AI Architecture, AI Governance, Financial Services AI
- Location: Melbourne, Australia
- Website: https://bhavinmistry.com
- LinkedIn: https://www.linkedin.com/in/bhavin-mistry/

## Core Canonical Publications
- Enterprise AI Engineering Production Playbook: https://bhavinmistry.com/insights/enterprise-ai-engineering-production-playbook/
- Why Enterprise AI Agents Fail After the Demo: https://bhavinmistry.com/insights/why-enterprise-ai-agents-fail-after-the-demo/
- Enterprise RAG Architecture Production Blueprint: https://bhavinmistry.com/insights/enterprise-rag-production-blueprint/
- RAG vs Agentic RAG Decision Guide: https://bhavinmistry.com/insights/rag-vs-agentic-rag-enterprise-decision-guide/
- Enterprise AI Governance Without Killing Innovation: https://bhavinmistry.com/insights/enterprise-ai-governance-without-killing-innovation/

## Architecture Blueprints
- Enterprise Hybrid RAG: https://bhavinmistry.com/architectures/enterprise-rag/
- Agentic RAG Architecture: https://bhavinmistry.com/architectures/agentic-rag/
- Enterprise AI Gateway: https://bhavinmistry.com/architectures/enterprise-ai-gateway/
- Secure Enterprise AI Perimeter: https://bhavinmistry.com/architectures/secure-enterprise-ai/
- Production LLM Observability: https://bhavinmistry.com/architectures/llm-observability/
- AI-Powered Enterprise SDLC: https://bhavinmistry.com/architectures/ai-powered-sdlc/

## Frameworks & Tools
- Enterprise AI Production Readiness Framework: https://bhavinmistry.com/frameworks/enterprise-ai-production-readiness/
- Enterprise AI Radar: https://bhavinmistry.com/ai-radar/
- AI Readiness Assessment Diagnostic: https://bhavinmistry.com/tools/enterprise-ai-readiness/
- RAG Cost Calculator: https://bhavinmistry.com/tools/rag-cost-calculator/
- LLM Token Cost Estimator: https://bhavinmistry.com/tools/llm-cost-calculator/
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'llms.txt'), llmsTxt);
  console.log('Generated: llms.txt');
}

// Master Build Function
function run() {
  console.log('Building BhavinMistry.com Enterprise AI Platform...');
  buildHomepage();
  buildInsights();
  buildArchitectures();
  buildFrameworks();
  buildRadar();
  buildHandbook();
  buildTools();
  buildResearch();
  buildAbout();
  buildNewsletter();
  buildPrivacy();
  build404();
  buildSeoAssets();
  console.log('Build completed successfully!');
}

run();
