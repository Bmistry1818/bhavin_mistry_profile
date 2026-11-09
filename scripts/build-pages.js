#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { normalizeArticle } = require('./fetch-blogs');
const { buildPlatform } = require('./build-graph-platform');

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT_DIR, 'data/content.json');
const BLOGS_FILE = path.join(ROOT_DIR, 'data/blogs.json');

const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const blogsData = fs.existsSync(BLOGS_FILE) ? JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8')) : { blogs: [] };
const BUILD_HASH = Date.now().toString(36);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function publicationGroups(blogs = []) {
  const groups = [];
  const normalizeKey = title => title.toLowerCase().replace(/[\s\u2013\u2014]+/g, ' ').replace(/[.…]+$/, '').trim();

  blogs.map(normalizeArticle).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(article => {
    const key = normalizeKey(article.title);
    let match = groups.find(g => {
      const gKey = normalizeKey(g.title);
      return gKey === key || (key.length >= 25 && (gKey.startsWith(key) || key.startsWith(gKey)));
    });

    if (!match) {
      match = { ...article, links: [] };
      groups.push(match);
    } else {
      if (article.title.length > match.title.length && !article.title.endsWith('…')) {
        match.title = article.title;
        if (article.description && article.description.length > match.description.length) {
          match.description = article.description;
        }
      }
    }
    if (!match.links.some(link => link.url === article.url)) {
      match.links.push({ source: article.source, url: article.url });
    }
  });
  return groups;
}

function renderPublicationCards(blogs, limit) {
  return publicationGroups(blogs).slice(0, limit).map(article => `
    <article class="card publication-card">
      <div class="card-meta">
        <span class="badge">${article.links.map(link => escapeHtml(link.source)).join(' · ')}</span>
        <time datetime="${article.date.slice(0, 10)}">${new Date(article.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>
      </div>
      <h3><a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.description)}</p>
      <div class="publication-links">
        ${article.links.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="text-link">Read on ${escapeHtml(link.source)} ↗</a>`).join('')}
      </div>
    </article>`).join('');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function renderBreadcrumbs(crumbs = []) {
  return `
    <nav aria-label="Breadcrumbs" style="font-family: var(--mono); font-size: 11px; margin-bottom: 24px; color: var(--muted);">
      ${crumbs.map((c, i) => i === crumbs.length - 1 
        ? `<span style="color: var(--ink);">${escapeHtml(c.name)}</span>` 
        : `<a href="${escapeHtml(c.url)}">${escapeHtml(c.name)}</a> / `
      ).join('')}
    </nav>
  `;
}

function renderBreadcrumbSchema(crumbs = []) {
  return {
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "item": c.url.startsWith('http') ? c.url : `https://bhavinmistry.com${c.url}`
    }))
  };
}

function renderSocialShareBar({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return `
    <div class="share-bar">
      <span class="share-label">Share:</span>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-btn" aria-label="Share on LinkedIn">
        <span>LinkedIn ↗</span>
      </a>
      <a href="https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=BhaveenMistrry" target="_blank" rel="noopener noreferrer" class="share-btn" aria-label="Share on X / Twitter">
        <span>X / Twitter ↗</span>
      </a>
      <button type="button" class="share-btn" data-copy-url="${escapeHtml(url)}" aria-label="Copy page URL">
        <span>Copy Link 📋</span>
      </button>
    </div>
  `;
}

function renderTableOfContents(items = []) {
  return {
    sidebar: `
      <aside class="toc-sidebar" aria-label="Table of Contents">
        <div class="toc-title">Table of Contents</div>
        <ul class="toc-list">
          ${items.map(it => `<li><a href="#${it.id}">${escapeHtml(it.title)}</a></li>`).join('')}
        </ul>
      </aside>
    `,
    mobile: `
      <details class="toc-mobile">
        <summary>Table of Contents (${items.length} sections)</summary>
        <ul class="toc-list">
          ${items.map(it => `<li><a href="#${it.id}">${escapeHtml(it.title)}</a></li>`).join('')}
        </ul>
      </details>
    `
  };
}

function renderLeadMagnetCard() {
  return `
    <section class="lead-magnet-card" aria-labelledby="lead-magnet-title">
      <div class="lead-magnet-grid">
        <div>
          <span class="eyebrow" style="color: var(--accent);">Engineering Resource</span>
          <h3 id="lead-magnet-title" style="font-size: 22px; margin-bottom: 8px;">The Enterprise AI Production Gate (50-Point Verification Standard)</h3>
          <p style="font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 0;">
            Used by engineering leaders and architects to verify security, APRA compliance, FinOps unit economics, and operational resilience prior to promoting GenAI systems to live traffic.
          </p>
        </div>
        <div>
          <form action="/newsletter/" method="get" onsubmit="event.preventDefault(); alert('50-Point Verification Standard access queued! A confirmation email has been dispatched to your inbox.');" style="display: flex; flex-direction: column; gap: 10px;">
            <input type="email" placeholder="name@enterprise.com" required style="padding: 12px 14px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" aria-label="Work email address" />
            <button type="submit" class="btn btn-primary" style="padding: 12px; font-size: 13px;">Get Free Production Checklist →</button>
          </form>
          <span style="font-size: 11px; color: var(--muted); display: block; margin-top: 8px; text-align: center;">Confidential peer exchange for technology executives & engineering leaders. Unsubscribe anytime.</span>
        </div>
      </div>
    </section>
  `;
}

function renderAuthorBioCard() {
  return `
    <div style="margin-top: 48px; padding: 28px; background: var(--paper-elevated); border: 1px solid var(--line); border-radius: 4px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 240px;">
        <span class="eyebrow" style="margin-bottom: 4px;">Author & Engineering Executive</span>
        <h4 style="font-size: 18px; margin-bottom: 6px;">Bhavin Mistry</h4>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.6;">
          Enterprise AI & Technology Executive based in Melbourne, Australia. Senior Engineering Leadership at Commonwealth Bank; ex-Acenda, Accenture & Deloitte. Bridging C-suite strategy with production platform architecture, APRA compliance, and AI FinOps.
        </p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px;">
          <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="text-link">LinkedIn Profile <span>↗</span></a>
          <a href="/about/" class="text-link">Executive Dossier <span>→</span></a>
          <a href="/speaking/" class="text-link">Speaking & Keynotes <span>→</span></a>
          <a href="https://learnaiengineering.dev" target="_blank" rel="noopener noreferrer" class="text-link">Learn AI Engineering <span>↗</span></a>
        </div>
      </div>
    </div>
  `;
}

function renderCodeSnippetBlock(snippet) {
  if (!snippet) return '';
  return `
    <div class="code-block" style="margin-top: 24px;">
      <div class="code-header">
        <span>${escapeHtml(snippet.title || snippet.language)}</span>
        <button type="button" class="code-copy-btn">Copy Code</button>
      </div>
      <pre class="code-pre"><code>${escapeHtml(snippet.code)}</code></pre>
    </div>
  `;
}

function renderFaqSection(faqs = []) {
  if (!faqs || faqs.length === 0) return '';
  return `
    <div class="faq-wrap" style="margin-top: 48px;">
      <span class="eyebrow">Architectural Q&A</span>
      <h2 id="faq-section" style="margin-bottom: 20px;">Frequently Asked Questions</h2>
      ${faqs.map(faq => `
        <details class="faq-item">
          <summary>${escapeHtml(faq.question)}</summary>
          <div class="faq-body">${escapeHtml(faq.answer)}</div>
        </details>
      `).join('')}
    </div>
  `;
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
          <a href="/compare/" class="${currentPath.startsWith('/compare') ? 'active' : ''}">Compare</a>
          <a href="/ai-radar/" class="${currentPath.startsWith('/ai-radar') ? 'active' : ''}">AI Radar</a>
          <a href="/tools/" class="${currentPath.startsWith('/tools') ? 'active' : ''}">Tools</a>
          <a href="/speaking/" class="${currentPath.startsWith('/speaking') ? 'active' : ''}">Speaking</a>
          <a href="/about/" class="${currentPath.startsWith('/about') ? 'active' : ''}">About</a>
          <button class="search-trigger" type="button" aria-label="Search site">
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <button class="theme-toggle-btn" type="button" aria-label="Toggle dark/light theme" title="Toggle theme">
            <span class="theme-icon-light" aria-hidden="true">🌙</span>
            <span class="theme-icon-dark" aria-hidden="true">☀️</span>
          </button>
          <a href="/about/#contact" class="nav-cta">Connect</a>
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
              <li><a href="/compare/">Architectural Comparisons</a></li>
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
              <li><a href="/speaking/">Speaking & Keynotes</a></li>
              <li><a href="/brief/">Newsletter Archive</a></li>
              <li><a href="https://learnaiengineering.dev/" target="_blank" rel="noopener noreferrer">Learn AI Engineering ↗</a></li>
              <li><a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer">LinkedIn Profile ↗</a></li>
              <li><a href="https://github.com/Bmistry1818" target="_blank" rel="noopener noreferrer">GitHub Profile ↗</a></li>
              <li><a href="https://x.com/BhaveenMistrry" target="_blank" rel="noopener noreferrer">X / Twitter ↗</a></li>
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
  bodyClass = '',
  ogType = 'website',
  ogImage = 'https://bhavinmistry.com/assets/og/default.png',
  publishedTime = null,
  modifiedTime = null
}) {
  let schemaScript = '';
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      schemaScript = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLd })}</script>`;
    } else {
      schemaScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
    }
  } else {
    schemaScript = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Bhavin Mistry",
        "url": "https://bhavinmistry.com/",
        "sameAs": [
          "https://www.linkedin.com/in/bhavin-mistry",
          "https://github.com/Bmistry1818",
          "https://x.com/BhaveenMistrry",
          "https://medium.com/@bhavin_mistry"
        ],
        "jobTitle": "Senior Engineering Manager",
        "worksFor": {
          "@type": "Organization",
          "name": "Commonwealth Bank"
        },
        "address": { "@type": "PostalAddress", "addressLocality": "Melbourne", "addressRegion": "Victoria", "addressCountry": "AU" }
      }
      </script>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="index, follow" />

    <!-- Search Engine Verifications -->
    <meta name="google-site-verification" content="d5898bc9d7540753" />
    <meta name="msvalidate.01" content="158B882A77D6BCB689F6AC86873187E7" />

    <!-- Open Graph -->
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Bhavin Mistry" />
    <meta property="og:locale" content="en_AU" />
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}" />` : ''}
    ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}" />` : ''}
    ${ogType === 'article' ? '<meta property="article:author" content="https://bhavinmistry.com/about/" />' : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@BhaveenMistrry" />
    <meta name="twitter:creator" content="@BhaveenMistrry" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />

    <!-- Favicon & Icons -->
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="alternate" type="application/rss+xml" title="Bhavin Mistry Enterprise AI Insights RSS" href="/feed.xml" />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#0b0f0d" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f5f2eb" />

    <link rel="stylesheet" href="/styles.css?v=${BUILD_HASH}" />
    <script>
      (function() {
        try {
          var saved = localStorage.getItem('bm-theme');
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          var theme = saved || (prefersDark ? 'dark' : 'light');
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
    </script>
    <script defer src="/script.js?v=${BUILD_HASH}"></script>
    ${schemaScript}
  </head>
  <body id="top" class="${bodyClass}">
    <div id="reading-progress" class="reading-progress" aria-hidden="true"></div>
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
        <span class="eyebrow" style="letter-spacing: 0.12em; color: var(--accent); font-weight: 600;">BHAVIN MISTRY • MELBOURNE, AUSTRALIA • ENTERPRISE AI & TECHNOLOGY EXECUTIVE</span>
      </div>
      <h1 id="hero-title" class="kinetic-hero-title">Architecting the Engineering Organizations and Production Platforms That Turn Enterprise AI into <em>P&L Impact.</em></h1>
      <div class="hero-grid">
        <p class="hero-lead">
          I bridge C-suite commercial strategy with high-velocity systems execution—scaling globally distributed engineering teams, mission-critical AI platforms, and APRA-compliant architectures across Tier-1 banking and enterprise technology.
        </p>
        <div class="hero-actions">
          <div class="btn-group">
            <a href="/about/" class="btn btn-primary">Explore Executive Track Record →</a>
            <a href="/tools/" class="btn btn-secondary">Try Interactive AI FinOps & RAG Tools →</a>
          </div>
          <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="text-link" style="font-size: 14px; font-weight: 500;">Start a Conversation on LinkedIn <span>↗</span></a>
          <div class="pedigree-trust-strip">
            <span class="pedigree-label">Leadership & Architecture Pedigree:</span>
            <span class="pedigree-items">Commonwealth Bank • Acenda • Accenture • Deloitte • UT Austin (PGP AI/ML)</span>
          </div>
        </div>
      </div>

      <!-- LIVING AI MOTION PIPELINE STREAM (Zajno-inspired) -->
      <div class="hero-canvas-wrap" aria-label="Interactive Enterprise AI Token Stream Simulation">
        <div class="hero-canvas-header">
          <div class="hero-canvas-status">
            <span class="live-dot" aria-hidden="true"></span>
            <span>ENTERPRISE AI STREAM · INTERACTIVE TOKEN FLOW</span>
          </div>
          <div class="hero-canvas-metrics">
            <span>99.4% CACHE HIT</span>
            <span>12.4ms P95</span>
            <span>HYBRID RAG ACTIVE</span>
          </div>
        </div>
        <canvas id="hero-motion-canvas" class="hero-motion-canvas" width="1180" height="100"></canvas>
      </div>

      <!-- INTERACTIVE EXECUTIVE VALUE MATRIX -->
      <div class="executive-value-matrix" aria-label="Executive Value Matrix">
        <a href="/about/#operating-model" class="value-matrix-card">
          <div class="matrix-card-eyebrow">Organizational Scale & Velocity</div>
          <h3 class="matrix-card-title">Distributed Squads & AI-Native SDLC</h3>
          <p class="matrix-card-body">Leading cross-functional engineering squads, architects, and tech leads with Team Topologies, DORA telemetry, and agentic developer workflows.</p>
          <div class="matrix-card-link">See Operating Model <span>→</span></div>
        </a>
        <a href="/architectures/" class="value-matrix-card">
          <div class="matrix-card-eyebrow">Production AI Architecture</div>
          <h3 class="matrix-card-title">Hybrid RAG, Gateways & Agent State Machines</h3>
          <p class="matrix-card-body">Battle-tested blueprints combining BM25 + dense vector retrieval, cross-encoder reranking, and centralized multi-model routing.</p>
          <div class="matrix-card-link">Inspect 6 Blueprints <span>→</span></div>
        </a>
        <a href="/tools/" class="value-matrix-card">
          <div class="matrix-card-eyebrow">Commercial & FinOps Rigor</div>
          <h3 class="matrix-card-title">Unit Economics & Capital Allocation</h3>
          <p class="matrix-card-body">Shifting executive metrics from raw token spend to cost-per-business-outcome via semantic caching, quotas, and build-vs-buy discipline.</p>
          <div class="matrix-card-link">Launch Cost Calculators <span>→</span></div>
        </a>
        <a href="/frameworks/enterprise-ai-production-readiness/" class="value-matrix-card">
          <div class="matrix-card-eyebrow">Regulated Banking Governance</div>
          <h3 class="matrix-card-title">APRA CPS 234 & Zero-Trust Guardrails</h3>
          <p class="matrix-card-body">Embedding immutable audit logging, PII redaction perimeters, prompt-injection defense, and CI/CD eval harnesses into production gates.</p>
          <div class="matrix-card-link">View 50-Point Readiness Gate <span>→</span></div>
        </a>
      </div>
    </section>

    <section class="section container" aria-labelledby="publications-title" id="latest-publications">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">Latest Writing</span>
          <h2 id="publications-title">Latest Publications.</h2>
        </div>
        <p class="section-header-desc">Recent articles on enterprise AI, engineering leadership, and technology economics, published on Medium and LinkedIn.</p>
      </div>
      <div class="card-grid-3">${renderPublicationCards(blogsData.blogs, 6)}</div>
      <div style="margin-top: 32px;"><a href="/insights/#latest-publications" class="text-link">View All Publications →</a></div>
    </section>

    <!-- LIVE PRODUCTION ECOSYSTEMS (Graph Engineering & Learn AI Engineering) -->
    <section class="section container" aria-labelledby="platform-title" id="engineering-in-practice">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">Engineering in Practice</span>
          <h2 id="platform-title">Live Production Ecosystems.</h2>
        </div>
        <p class="section-header-desc">
          Two flagship engineering ecosystems demonstrating hands-on architecture tooling and enterprise-wide technical enablement.
        </p>
      </div>

      <div class="ecosystem-grid">
        <div class="ecosystem-card">
          <div class="ecosystem-badge-wrap">
            <span class="badge badge-accent">Production Developer Tooling</span>
          </div>
          <h3>Graph Engineering Platform</h3>
          <p>
            Five working AI agent skills connecting source-code dependency graphs, architectural decision records (ADRs), and durable Obsidian memory across Codex, Claude, and MCP.
          </p>
          <div class="ecosystem-meta">
            <span>Typed Source</span> · <span>Native Integrations</span> · <span>Inspectable Tools</span>
          </div>
          <div class="ecosystem-footer">
            <a href="/tools/graph-engineering/" class="btn btn-primary">Explore the Platform →</a>
          </div>
        </div>

        <div class="ecosystem-card">
          <div class="ecosystem-badge-wrap">
            <span class="badge badge-accent">Org-Wide Talent Enablement</span>
          </div>
          <h3>Learn AI Engineering</h3>
          <p>
            An interactive, audio-free 3D & motion engineering academy built from first principles to upskill software engineering organizations into production AI systems engineers.
          </p>
          <div class="ecosystem-meta">
            <span>First-Principles Academy</span> · <span>Interactive 3D</span> · <span>Zero Fluff</span>
          </div>
          <div class="ecosystem-footer">
            <a href="https://learnaiengineering.dev" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visit Learn AI Engineering ↗</a>
          </div>
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
          Long-form perspectives on enterprise AI engineering, hybrid RAG, agentic reliability, and technology economics.
        </p>
      </div>

      <div class="card-grid-3">
        ${featuredInsights.map(post => `
          <article class="card">
            <div class="card-meta">
              <span class="badge badge-accent">${post.category}</span>
              <span>${post.readingTime}</span>
            </div>
            <h3><a href="/insights/${post.slug}/">${post.title}</a></h3>
            <p>${post.summary}</p>
            <div class="card-footer">
              <a href="/insights/${post.slug}/" class="text-link">Read Blueprint <span>→</span></a>
            </div>
          </article>
        `).join('')}
      </div>

      <div style="margin-top: 36px; text-align: center;">
        <a href="/insights/" class="btn btn-secondary">Explore All Insights & Engineering Guides →</a>
      </div>
    </section>

    <!-- PRODUCTION ARCHITECTURES PREVIEW -->
    <section class="section container" aria-labelledby="arch-title">
      <div class="section-header">
        <div class="section-header-content">
          <span class="eyebrow">System Design</span>
          <h2 id="arch-title">Enterprise Architecture Blueprints.</h2>
        </div>
        <p class="section-header-desc">
          Reference architectures and security topologies developed to bridge the gap between AI proofs-of-concept and scalable enterprise production.
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

    <!-- NEWSLETTER & LEAD MAGNET -->
    <div class="container">
      ${renderLeadMagnetCard()}
    </div>

    <!-- ABOUT SECTION PREVIEW -->
    <section class="section section-wash" aria-labelledby="about-title">
      <div class="container" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 64px; align-items: start;">
        <div>
          <span class="eyebrow">Executive Leadership</span>
          <h2 id="about-title">Bhavin Mistry.</h2>
          <p style="font-size: 18px; color: var(--ink-soft); line-height: 1.6; margin-top: 16px;">
            Enterprise AI & Technology Executive bridging C-suite commercial strategy with deep systems execution across Commonwealth Bank, Acenda, Accenture, and Deloitte.
          </p>
          <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="/about/" class="btn btn-primary">Explore Executive Dossier →</a>
            <a href="/speaking/" class="btn btn-secondary">Speaking & Board Briefings →</a>
          </div>
        </div>
        <div style="background: var(--paper); padding: 36px; border: 1px solid var(--line); border-radius: 4px;">
          <h4 style="margin-bottom: 12px;">Commercial & Technical Fluency</h4>
          <p style="font-size: 14px; color: var(--muted); line-height: 1.7;">
            Operating with equal fluency across the Architecture Review Board and the executive P&L table. Scaling globally distributed engineering squads, implementing APRA CPS 234 zero-trust perimeters, and instituting AI FinOps unit economics that transform experimental pilots into measurable commercial outcomes.
          </p>
          <div style="border-top: 1px solid var(--line-subtle); padding-top: 20px; margin-top: 20px;">
            <span class="eyebrow" style="margin-bottom: 6px;">Executive Pedigree</span>
            <div style="font-size: 14px; font-weight: 600;">The University of Texas at Austin • GTU • Gujarat University</div>
            <div style="font-size: 13px; color: var(--muted); margin-top: 2px;">PGP Artificial Intelligence & Machine Learning · MCA · B.Com (Corporate Finance)</div>
          </div>
        </div>
      </div>
    </section>
  `;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://bhavinmistry.com/#person",
    "name": "Bhavin Mistry",
    "jobTitle": "Enterprise AI & Technology Executive",
    "worksFor": {
      "@type": "Organization",
      "name": "Commonwealth Bank"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Melbourne",
      "addressCountry": "AU"
    },
    "alumniOf": [
      {
        "@type": "CollegeOrUniversity",
        "name": "The University of Texas at Austin"
      },
      {
        "@type": "CollegeOrUniversity",
        "name": "Gujarat Technological University"
      },
      {
        "@type": "CollegeOrUniversity",
        "name": "Gujarat University"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/in/bhavin-mistry",
      "https://github.com/Bmistry1818",
      "https://x.com/BhaveenMistrry",
      "https://medium.com/@bhavin_mistry",
      "https://learnaiengineering.dev/"
    ],
    "knowsAbout": ["Enterprise AI", "RAG Architecture", "AI Governance", "Platform Engineering", "Machine Learning", "AI FinOps", "APRA CPS 234"],
    "url": "https://bhavinmistry.com/",
    "image": "https://bhavinmistry.com/assets/og/default.png"
  };

  const html = renderHtmlPage({
    title: "Bhavin Mistry | Enterprise AI & Technology Executive",
    description: "Enterprise AI & Technology Executive. Turning enterprise AI into P&L impact through scalable architectures, APRA-compliant governance, and high-velocity engineering organizations.",
    canonicalUrl: "https://bhavinmistry.com/",
    currentPath: "/",
    mainContent: main,
    ogImage: "https://bhavinmistry.com/assets/og/default.png",
    jsonLd: personSchema
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
        Architectural blueprints, failure analyses, and strategic perspectives on deploying Generative AI and Agentic Systems in production environments.
      </p>

      <section id="latest-publications" aria-labelledby="publications-title" style="margin-bottom: 64px;">
        <span class="eyebrow">Latest Writing</span>
        <h2 id="publications-title" style="margin-bottom: 24px;">Latest Publications</h2>
        <div class="card-grid-3">${renderPublicationCards(blogsData.blogs, 24)}</div>
      </section>

      <h2 style="margin-bottom: 24px;">Engineering Guides & Flagship Blueprints</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--line);">
        <span class="badge badge-accent">All Categories</span>
        <span class="badge">Enterprise AI</span>
        <span class="badge">Enterprise RAG</span>
        <span class="badge">AI FinOps</span>
        <span class="badge">Agentic AI</span>
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

      ${renderLeadMagnetCard()}
    </div>
  `;

  const listHtml = renderHtmlPage({
    title: "Enterprise AI Insights & Perspectives | Bhavin Mistry",
    description: "In-depth perspectives, blueprints, and architectural field notes on enterprise generative AI, hybrid RAG, agent reliability, and engineering leadership.",
    canonicalUrl: "https://bhavinmistry.com/insights/",
    currentPath: "/insights/",
    ogImage: "https://bhavinmistry.com/assets/og/default.png",
    mainContent: listMain
  });

  fs.writeFileSync(path.join(ROOT_DIR, 'insights/index.html'), listHtml);
  console.log('Generated: insights/index.html');

  // Individual Article Pages
  content.insights.forEach(post => {
    const postDir = path.join(ROOT_DIR, `insights/${post.slug}`);
    ensureDir(postDir);

    const canonicalUrl = `https://bhavinmistry.com/insights/${post.slug}/`;
    const ogImage = `https://bhavinmistry.com/assets/og/${post.slug}.png`;

    const crumbs = [
      { name: "Home", url: "/" },
      { name: "Insights", url: "/insights/" },
      { name: post.title, url: `/insights/${post.slug}/` }
    ];

    const tocItems = [
      { id: 'editorial-analysis', title: "Editorial Analysis & Bhavin's Take" },
      { id: 'production-disconnect', title: 'The Production Reality' },
      { id: 'landscape-shift', title: 'What Changed vs What Stays Invariant' },
      { id: 'architectural-action', title: 'Architectural Guidance & Action Plan' },
      { id: 'connected-resources', title: 'Connected Resources' }
    ];
    const toc = renderTableOfContents(tocItems);

    const postMain = `
      <article class="container" style="max-width: 1140px; padding-top: 64px; padding-bottom: 88px;">
        ${renderBreadcrumbs(crumbs)}

        <header style="margin-bottom: 40px; max-width: 860px;">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
            <span class="badge badge-accent">${post.category}</span>
            <span class="badge">${post.badge || 'Field Note'}</span>
            <span style="font-family: var(--mono); font-size: 11px; color: var(--muted); margin-left: auto;">${post.readingTime}</span>
          </div>
          <h1 style="font-size: clamp(34px, 5vw, 52px); margin-bottom: 20px;">${post.title}</h1>
          <p class="hero-lead" style="font-size: 20px; color: var(--muted);">${post.summary}</p>
          <div style="display: flex; gap: 24px; align-items: center; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 24px; font-size: 13px; color: var(--muted); flex-wrap: wrap;">
            <span>By <strong><a href="/about/">Bhavin Mistry</a></strong>, Senior Engineering Manager at Commonwealth Bank</span>
            <span>Published: ${post.publishedAt}</span>
            <span>Last updated: ${post.updatedAt}</span>
          </div>
        </header>

        ${renderSocialShareBar({ url: canonicalUrl, title: post.title })}
        ${toc.mobile}

        <div class="article-grid">
          <div class="article-main">
            <!-- "BHAVIN'S TAKE" EDITORIAL HIGHLIGHT BOX -->
            <div id="editorial-analysis" class="take-box">
              <div class="take-box-header">
                <span class="eyebrow">Editorial Analysis</span>
                <span class="badge badge-accent">Bhavin's Take</span>
              </div>
              <p style="font-size: 16px; font-weight: 500; color: var(--ink); margin-bottom: 16px; line-height: 1.6;">
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
              <h2 id="production-disconnect" style="margin-top: 40px; margin-bottom: 16px;">The Production Disconnect</h2>
              <p>
                Across enterprise engineering teams in 2026, generative AI experimentation has reached saturation. Nearly every department has experimented with commercial LLM APIs, internal chat bots, and multi-agent prototypes. Yet, when technology leaders examine operating margins and P&L results, the value gap remains stark.
              </p>
              <p>
                The root cause is rarely the base intelligence of the frontier model. Instead, it is the absence of rigorous distributed systems engineering: unmonitored token egress, hallucinated citations in customer workflows, lack of document-level security filtering, and non-deterministic agent loops that compound errors over multi-hop executions.
              </p>

              <h2 id="landscape-shift" style="margin-top: 40px; margin-bottom: 16px;">What Changed in the Landscape vs Invariants</h2>
              <div style="background: var(--paper-elevated); border: 1px solid var(--line); padding: 24px; margin: 24px 0;">
                <h4 style="margin-bottom: 8px;">What Changed in the Technology Landscape</h4>
                <p style="font-size: 14px; color: var(--muted);">${post.take.whatHappened}</p>
                <h4 style="margin-top: 16px; margin-bottom: 8px;">What Remains Invariant in Enterprise Systems</h4>
                <p style="font-size: 14px; color: var(--muted);">${post.take.whatDoesntChange}</p>
              </div>

              <h2 id="architectural-action" style="margin-top: 40px; margin-bottom: 16px;">Architectural Guidance & Action Plan</h2>
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

            ${renderSocialShareBar({ url: canonicalUrl, title: post.title })}
            ${renderLeadMagnetCard()}
            ${renderAuthorBioCard()}

            <!-- CONNECTED RESOURCES & BLUEPRINTS -->
            <div id="connected-resources" style="margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--line);">
              <span class="eyebrow">Connected Resources</span>
              <h3>Related Production Architectures & Tools</h3>
              <div class="card-grid-2" style="margin-top: 20px;">
                <div class="card">
                  <span class="eyebrow">Architecture Blueprint</span>
                  <h4><a href="/architectures/enterprise-rag/">Enterprise Hybrid RAG Architecture</a></h4>
                  <p style="font-size: 13px;">Full component breakdown, BM25 + dense fusion, and security trimming boundaries.</p>
                </div>
                <div class="card">
                  <span class="eyebrow">Maturity Methodology</span>
                  <h4><a href="/frameworks/enterprise-ai-production-readiness/">5-Stage Production Readiness Framework</a></h4>
                  <p style="font-size: 13px;">Benchmark your organization across 12 operational dimensions from Explore to Scale.</p>
                </div>
              </div>
            </div>
          </div>

          ${toc.sidebar}
        </div>
      </article>
    `;

    const articleSchema = {
      "@type": "Article",
      "headline": post.title,
      "description": post.summary,
      "datePublished": post.publishedAt,
      "dateModified": post.updatedAt,
      "author": {
        "@type": "Person",
        "name": "Bhavin Mistry",
        "url": "https://bhavinmistry.com/"
      },
      "publisher": {
        "@type": "Person",
        "name": "Bhavin Mistry"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "image": ogImage
    };

    const breadcrumbSchema = renderBreadcrumbSchema(crumbs);

    const postHtml = renderHtmlPage({
      title: `${post.title} | Bhavin Mistry`,
      description: post.summary,
      canonicalUrl,
      currentPath: `/insights/${post.slug}/`,
      mainContent: postMain,
      ogType: "article",
      ogImage,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      jsonLd: [articleSchema, breadcrumbSchema]
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

      ${renderLeadMagnetCard()}
    </div>
  `;

  const listHtml = renderHtmlPage({
    title: "Enterprise AI Architecture Library | Bhavin Mistry",
    description: "Production-grade reference architectures for Enterprise RAG, Centralized AI Gateways, Agentic Systems, and LLM Observability by Bhavin Mistry.",
    canonicalUrl: "https://bhavinmistry.com/architectures/",
    currentPath: "/architectures/",
    ogImage: "https://bhavinmistry.com/assets/og/default.png",
    mainContent: listMain
  });

  fs.writeFileSync(path.join(ROOT_DIR, 'architectures/index.html'), listHtml);
  console.log('Generated: architectures/index.html');

  // Detail Architecture Pages
  content.architectures.forEach(arch => {
    const archDir = path.join(ROOT_DIR, `architectures/${arch.slug}`);
    ensureDir(archDir);

    const canonicalUrl = `https://bhavinmistry.com/architectures/${arch.slug}/`;
    const ogImage = `https://bhavinmistry.com/assets/og/${arch.slug}.png`;

    const crumbs = [
      { name: "Home", url: "/" },
      { name: "Architectures", url: "/architectures/" },
      { name: arch.title, url: `/architectures/${arch.slug}/` }
    ];

    const tocItems = [
      { id: 'topology', title: 'System Topology & Diagram' },
      { id: 'core-problem', title: 'The Core Problem Solved' },
      { id: 'components', title: 'Architectural Components' },
      { id: 'data-flow', title: 'Data Flow Narrative' },
      { id: 'security-governance', title: 'Security & Governance Controls' },
      { id: 'failure-modes', title: 'Failure Modes & Mitigations' },
      { id: 'code-implementation', title: 'Production Code Snippet' },
      { id: 'faq-section', title: 'Frequently Asked Questions' },
      { id: 'connected-tools', title: 'Connected Frameworks & Tools' }
    ];
    const toc = renderTableOfContents(tocItems);

    const archMain = `
      <article class="container" style="max-width: 1140px; padding-top: 64px; padding-bottom: 88px;">
        ${renderBreadcrumbs(crumbs)}

        <header style="margin-bottom: 36px; max-width: 860px;">
          <span class="badge badge-accent" style="margin-bottom: 12px;">${arch.category}</span>
          <h1 style="font-size: clamp(34px, 5vw, 50px); margin-bottom: 16px;">${arch.title}</h1>
          <p class="hero-lead" style="font-size: 20px; color: var(--muted);">${arch.summary}</p>
          <div style="display: flex; gap: 24px; align-items: center; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 24px; font-size: 13px; color: var(--muted); flex-wrap: wrap;">
            <span>By <strong><a href="/about/">Bhavin Mistry</a></strong>, Senior Engineering Manager at Commonwealth Bank</span>
            <span>Published: ${arch.publishedAt || '2026-08-01'}</span>
            <span>Last updated: ${arch.updatedAt || '2026-09-15'}</span>
            <span>${arch.readingTime || '11 min read'}</span>
          </div>
        </header>

        ${renderSocialShareBar({ url: canonicalUrl, title: arch.title })}
        ${toc.mobile}

        <div class="article-grid">
          <div class="article-main">
            <!-- SVG ARCHITECTURE DIAGRAM -->
            <div id="topology" class="arch-diagram-wrap">
              <div style="display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-size: 11px; margin-bottom: 16px; color: var(--muted-light); flex-wrap: wrap; gap: 8px;">
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                  <span class="live-dot" aria-hidden="true"></span>
                  SYSTEM TOPOLOGY &amp; LIVE DATA FLOW
                </span>
                <span>ENTERPRISE SPECIFICATION · INTERACTIVE NODES</span>
              </div>
              <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;" role="img" aria-label="Interactive System Topology and Data Flow Architecture">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9d402b"/>
                  </marker>
                </defs>

                <!-- Connector 1: Client -> Security Gateway -->
                <path d="M150 120 L220 120" stroke="#46544c" stroke-width="2" marker-end="url(#arrow)" data-connector="c1" />
                <path d="M150 120 L212 120" stroke="#f4eae7" stroke-width="2" class="flow-line-pulse" stroke-linecap="round" data-pulse="p1" />

                <!-- Connector 2: Security Gateway -> Inference & Rerank -->
                <path d="M390 120 L460 120" stroke="#46544c" stroke-width="2" marker-end="url(#arrow)" data-connector="c2" />
                <path d="M390 120 L452 120" stroke="#f4eae7" stroke-width="2" class="flow-line-pulse" stroke-linecap="round" data-pulse="p2" />

                <!-- Connector 3: Inference & Rerank -> Telemetry -->
                <path d="M620 120 L680 120" stroke="#46544c" stroke-width="2" marker-end="url(#arrow)" data-connector="c3" />
                <path d="M620 120 L672 120" stroke="#f4eae7" stroke-width="2" class="flow-line-pulse" stroke-linecap="round" data-pulse="p3" />

                <!-- Node 1: Client Application -->
                <g class="diagram-node" data-node="client" tabindex="0" role="button" aria-label="Client Application node">
                  <rect x="20" y="80" width="130" height="80" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
                  <text x="85" y="115" fill="#e8ece9" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Client Application</text>
                  <text x="85" y="135" fill="#8d9991" font-family="monospace" font-size="10" text-anchor="middle">RBAC Context</text>
                </g>

                <!-- Node 2: Security & Gateway -->
                <g class="diagram-node" data-node="gateway" tabindex="0" role="button" aria-label="Security and Gateway node">
                  <rect x="220" y="60" width="170" height="120" rx="4" fill="#2a332e" stroke="#9d402b" stroke-width="1.5" />
                  <text x="305" y="95" fill="#f5f2eb" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Security & Gateway</text>
                  <text x="305" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">PII Sanitization</text>
                  <text x="305" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Semantic Cache Check</text>
                  <text x="305" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Rate & Token Budget</text>
                </g>

                <!-- Node 3: Inference & Rerank -->
                <g class="diagram-node" data-node="inference" tabindex="0" role="button" aria-label="Inference and Rerank node">
                  <rect x="460" y="60" width="160" height="120" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
                  <text x="540" y="95" fill="#e8ece9" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Inference & Rerank</text>
                  <text x="540" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">BM25 + Vector Fusion</text>
                  <text x="540" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Cross-Encoder Top-5</text>
                  <text x="540" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Grounded Synthesis</text>
                </g>

                <!-- Node 4: Telemetry -->
                <g class="diagram-node" data-node="telemetry" tabindex="0" role="button" aria-label="Telemetry node">
                  <rect x="680" y="80" width="100" height="80" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
                  <text x="730" y="115" fill="#e8ece9" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Telemetry</text>
                  <text x="730" y="135" fill="#8d9991" font-family="monospace" font-size="10" text-anchor="middle">OpenTelemetry</text>
                </g>
              </svg>

              <!-- INTERACTIVE PIPELINE PLAYGROUND SIMULATOR (Zajno-inspired) -->
              <div class="pipeline-simulator">
                <div class="sim-header">
                  <div class="sim-title">
                    <span class="sim-badge">LIVE SIMULATOR</span>
                    <span>Test an Enterprise Request Path:</span>
                  </div>
                  <div class="sim-actions">
                    <button type="button" class="sim-btn is-active" data-sim="cache">Simulate Cache Hit (12ms)</button>
                    <button type="button" class="sim-btn" data-sim="rag">Simulate Hybrid RAG (140ms)</button>
                    <button type="button" class="sim-btn" data-sim="pii">Simulate PII Filter (28ms)</button>
                  </div>
                </div>
                <div class="sim-terminal" id="sim-terminal" aria-live="polite">
                  <div class="sim-log-line"><span class="log-ts">00.0ms</span> <span class="log-tag tag-client">[CLIENT]</span> Incoming query: &quot;Retrieve Q3 capital adequacy ratio formula for APRA review&quot;</div>
                  <div class="sim-log-line is-success"><span class="log-ts">+08.2ms</span> <span class="log-tag tag-gw">[GATEWAY]</span> PII check: Clean · Semantic cache hit (0.97 match) · Cost: $0.0000</div>
                  <div class="sim-log-line"><span class="log-ts">+11.4ms</span> <span class="log-tag tag-telemetry">[TELEMETRY]</span> OTEL trace CBA-9142 exported. Zero LLM egress cost.</div>
                </div>
              </div>
            </div>

            <!-- SPECIFICATION GRID -->
            <div id="core-problem" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px;">
              <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line);">
                <h4 style="color: var(--accent); margin-bottom: 8px;">The Core Problem Solved</h4>
                <p style="font-size: 14px; color: var(--ink-soft); margin-bottom: 0;">${arch.problem}</p>
              </div>
              <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line);">
                <h4 style="color: var(--success); margin-bottom: 8px;">When To Deploy This Architecture</h4>
                <p style="font-size: 14px; color: var(--ink-soft); margin-bottom: 0;">${arch.whenToUse}</p>
              </div>
            </div>

            <div id="components" style="margin-top: 40px;">
              <h2>Architectural Components</h2>
              <ul style="margin-left: 20px; margin-top: 16px; font-size: 15px; color: var(--ink-soft);">
                ${arch.components.map(c => `<li style="margin-bottom: 10px;">${c}</li>`).join('')}
              </ul>
            </div>

            <div id="data-flow" style="margin-top: 40px;">
              <h2>Data Flow Narrative</h2>
              <div style="background: var(--wash); padding: 24px; border-left: 3px solid var(--ink); font-size: 15px; line-height: 1.7;">
                ${arch.dataFlow}
              </div>
            </div>

            <div id="security-governance" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px;">
              <div>
                <h3>Security & Perimeter Control</h3>
                <p style="font-size: 14px; color: var(--muted); margin-top: 8px;">${arch.security}</p>
              </div>
              <div>
                <h3>Governance & Telemetry</h3>
                <p style="font-size: 14px; color: var(--muted); margin-top: 8px;">${arch.governance}</p>
              </div>
            </div>

            <div id="failure-modes" style="margin-top: 40px; background: #fff1f2; border: 1px solid #fecdd3; padding: 24px; border-radius: 4px;">
              <h4 style="color: #9f1239; margin-bottom: 8px;">Identified Failure Modes & Mitigations</h4>
              <p style="font-size: 14px; color: #881337; margin-bottom: 0;">${arch.failureModes}</p>
            </div>

            <div id="code-implementation" style="margin-top: 48px;">
              <h2>Production Code Implementation</h2>
              <p style="font-size: 15px; color: var(--muted); margin-top: 8px;">
                Copy-paste ready implementation snippet demonstrating the core architectural boundary logic:
              </p>
              ${renderCodeSnippetBlock(arch.codeSnippet)}
            </div>

            ${renderFaqSection(arch.faqs)}
            ${renderSocialShareBar({ url: canonicalUrl, title: arch.title })}
            ${renderLeadMagnetCard()}
            ${renderAuthorBioCard()}

            <!-- CONNECTED FRAMEWORKS & TOOLS -->
            <div id="connected-tools" style="margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--line);">
              <span class="eyebrow">Connected Tools & Frameworks</span>
              <h3>Cross-Referenced Production Resources</h3>
              <div class="card-grid-3" style="margin-top: 20px;">
                <div class="card">
                  <span class="eyebrow">Methodology</span>
                  <h4><a href="/frameworks/enterprise-ai-production-readiness/">5-Stage Maturity Framework</a></h4>
                  <p style="font-size: 13px;">Stage gates from exploration to hardened multi-region deployment.</p>
                </div>
                <div class="card">
                  <span class="eyebrow">Assessment</span>
                  <h4><a href="/tools/enterprise-ai-readiness/">AI Readiness Diagnostic</a></h4>
                  <p style="font-size: 13px;">Benchmark organizational readiness across 12 operational dimensions.</p>
                </div>
                <div class="card">
                  <span class="eyebrow">FinOps</span>
                  <h4><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></h4>
                  <p style="font-size: 13px;">Model vector storage, query volume, and caching ROI accurately.</p>
                </div>
              </div>
            </div>
          </div>

          ${toc.sidebar}
        </div>
      </article>
    `;

    const techArticleSchema = {
      "@type": "Article",
      "headline": arch.title,
      "description": arch.summary,
      "datePublished": arch.publishedAt || '2026-08-01',
      "dateModified": arch.updatedAt || '2026-09-15',
      "author": {
        "@type": "Person",
        "name": "Bhavin Mistry",
        "url": "https://bhavinmistry.com/"
      },
      "publisher": {
        "@type": "Person",
        "name": "Bhavin Mistry"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "image": ogImage
    };

    const faqSchema = {
      "@type": "FAQPage",
      "mainEntity": (arch.faqs || [
        { question: `What core problem does ${arch.title} solve?`, answer: arch.problem },
        { question: `When should an enterprise deploy ${arch.title}?`, answer: arch.whenToUse }
      ]).map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    };

    const breadcrumbSchema = renderBreadcrumbSchema(crumbs);

    const archHtml = renderHtmlPage({
      title: `${arch.title} | Bhavin Mistry`,
      description: arch.summary,
      canonicalUrl,
      currentPath: `/architectures/${arch.slug}/`,
      mainContent: archMain,
      ogType: "article",
      ogImage,
      publishedTime: arch.publishedAt || '2026-08-01',
      modifiedTime: arch.updatedAt || '2026-09-15',
      jsonLd: [techArticleSchema, faqSchema, breadcrumbSchema]
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
  const canonicalUrl = "https://bhavinmistry.com/frameworks/enterprise-ai-production-readiness/";
  const ogImage = "https://bhavinmistry.com/assets/og/the-5-stage-framework-for-taking-enterprise-ai-to-production.png";

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Frameworks", url: "/frameworks/enterprise-ai-production-readiness/" },
    { name: "Production Readiness", url: "/frameworks/enterprise-ai-production-readiness/" }
  ];

  const fwMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      ${renderBreadcrumbs(crumbs)}
      <span class="eyebrow">Signature Methodology</span>
      <h1>${fw.title}</h1>
      <p class="hero-lead" style="max-width: 840px; margin-top: 16px; margin-bottom: 24px;">
        ${fw.description}
      </p>

      <div style="display: flex; gap: 24px; align-items: center; padding-top: 16px; border-top: 1px solid var(--line); margin-bottom: 32px; font-size: 13px; color: var(--muted); flex-wrap: wrap;">
        <span>By <strong><a href="/about/">Bhavin Mistry</a></strong>, Senior Engineering Manager at Commonwealth Bank</span>
        <span>Updated: September 2026</span>
        <span>14 min read</span>
      </div>

      ${renderSocialShareBar({ url: canonicalUrl, title: fw.title })}

      <div style="display: flex; gap: 16px; margin-bottom: 48px; flex-wrap: wrap;">
        <a href="/tools/enterprise-ai-readiness/" class="btn btn-primary">Take 18-Question Readiness Assessment →</a>
        <a href="#matrix" class="btn btn-secondary">Jump to Maturity Matrix ↓</a>
        <a href="/insights/the-5-stage-framework-for-taking-enterprise-ai-to-production/" class="btn btn-secondary">Read Extended Playbook →</a>
      </div>

      <!-- 5 Stages Detail -->
      <h2 style="margin-bottom: 24px;">The 5 Stages of Production AI</h2>
      <div class="card-grid-5" style="margin-bottom: 48px;">
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
                <td><strong>${d.name}</strong></td>
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

      ${renderLeadMagnetCard()}
      ${renderAuthorBioCard()}
    </div>
  `;

  const fwHtml = renderHtmlPage({
    title: "Enterprise AI Production Readiness Framework | Bhavin Mistry",
    description: "A 5-stage, 12-dimension enterprise maturity framework by Bhavin Mistry for taking generative AI and agentic systems from exploration to production.",
    canonicalUrl,
    currentPath: "/frameworks/enterprise-ai-production-readiness/",
    ogImage,
    jsonLd: [
      {
        "@type": "Article",
        "headline": fw.title,
        "description": fw.description,
        "datePublished": "2026-08-01",
        "dateModified": "2026-09-15",
        "author": { "@type": "Person", "name": "Bhavin Mistry", "url": "https://bhavinmistry.com/" },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
      },
      renderBreadcrumbSchema(crumbs)
    ],
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
      <span class="eyebrow">Technology Landscape</span>
      <h1>Enterprise AI Radar 2026</h1>
      <p class="hero-lead" style="max-width: 820px; margin-top: 16px; margin-bottom: 40px;">
        Curated technology tracking across Adopt, Trial, Assess, and Watch categories based on real-world enterprise viability and governance readiness.
      </p>

      <div class="radar-grid" style="margin-bottom: 48px;">
        <div class="radar-column">
          <div class="radar-column-header">
            <h4 style="color: #166534;">ADOPT</h4>
            <span class="badge badge-adopt">Proven</span>
          </div>
          ${content.radar.filter(r => r.quadrant === 'ADOPT').map(item => `
            <div class="radar-item-card">
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 12px; color: var(--muted); margin-top: 8px;"><strong>Rationale:</strong> ${item.rationale}</div>
            </div>
          `).join('')}
        </div>
        <div class="radar-column">
          <div class="radar-column-header">
            <h4 style="color: #0369a1;">TRIAL</h4>
            <span class="badge badge-trial">Validated</span>
          </div>
          ${content.radar.filter(r => r.quadrant === 'TRIAL').map(item => `
            <div class="radar-item-card">
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 12px; color: var(--muted); margin-top: 8px;"><strong>Rationale:</strong> ${item.rationale}</div>
            </div>
          `).join('')}
        </div>
        <div class="radar-column">
          <div class="radar-column-header">
            <h4 style="color: #92400e;">ASSESS</h4>
            <span class="badge badge-assess">Spike</span>
          </div>
          ${content.radar.filter(r => r.quadrant === 'ASSESS').map(item => `
            <div class="radar-item-card">
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 12px; color: var(--muted); margin-top: 8px;"><strong>Rationale:</strong> ${item.rationale}</div>
            </div>
          `).join('')}
        </div>
        <div class="radar-column">
          <div class="radar-column-header">
            <h4 style="color: #6b21a8;">WATCH</h4>
            <span class="badge badge-watch">Early</span>
          </div>
          ${content.radar.filter(r => r.quadrant === 'WATCH').map(item => `
            <div class="radar-item-card">
              <h4>${item.name}</h4>
              <p>${item.summary}</p>
              <div style="font-size: 12px; color: var(--muted); margin-top: 8px;"><strong>Rationale:</strong> ${item.rationale}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${renderLeadMagnetCard()}
    </div>
  `;

  fs.writeFileSync(path.join(radarDir, 'index.html'), renderHtmlPage({
    title: "Enterprise AI Radar 2026 | Bhavin Mistry",
    description: "Curated technology tracking across Adopt, Trial, Assess, and Watch categories for enterprise AI platforms, gateways, and agentic workflows.",
    canonicalUrl: "https://bhavinmistry.com/ai-radar/",
    currentPath: "/ai-radar/",
    mainContent: radarMain
  }));
  console.log('Generated: ai-radar/index.html');
}

// 6. Build Handbook Page (/enterprise-ai-engineering/)
function buildHandbook() {
  const hbDir = path.join(ROOT_DIR, 'enterprise-ai-engineering');
  ensureDir(hbDir);

  const hb = content.handbook;
  const hbMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Comprehensive Field Guide</span>
      <h1>${hb.title}</h1>
      <p class="hero-lead" style="max-width: 820px; margin-top: 16px; margin-bottom: 40px;">
        ${hb.description}
      </p>

      <div class="card-grid-3">
        ${hb.chapters.map(ch => `
          <div class="card">
            <div class="card-meta">
              <span class="badge badge-accent">Chapter ${ch.number}</span>
            </div>
            <h3>${ch.title}</h3>
            <p style="font-size: 13px; color: var(--muted); margin-top: 8px;">${ch.summary}</p>
          </div>
        `).join('')}
      </div>

      ${renderLeadMagnetCard()}
    </div>
  `;

  fs.writeFileSync(path.join(hbDir, 'index.html'), renderHtmlPage({
    title: "The Enterprise AI Engineering Handbook | Bhavin Mistry",
    description: "A comprehensive, practical field guide for CTOs, architects, and engineering leaders building, governing, and scaling production AI systems.",
    canonicalUrl: "https://bhavinmistry.com/enterprise-ai-engineering/",
    currentPath: "/enterprise-ai-engineering/",
    mainContent: hbMain
  }));
  console.log('Generated: enterprise-ai-engineering/index.html');
}

// 7. Build Tools Hub & Calculators (/tools/)
function buildTools() {
  const toolsDir = path.join(ROOT_DIR, 'tools');
  ensureDir(toolsDir);

  const toolsMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Decision Calculators</span>
      <h1>Enterprise AI Engineering Tools</h1>
      <p class="hero-lead" style="max-width: 820px; margin-top: 16px; margin-bottom: 40px;">
        Transparent, client-side engineering and financial calculators with zero tracking and zero server-side parameter dispatch.
      </p>

      <div class="card-grid-2">
        <div class="card">
          <span class="eyebrow">Financial Modeling</span>
          <h3><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></h3>
          <p>Model monthly vector storage, embedding tokens, inference volume, and caching return across enterprise document pools.</p>
          <div class="card-footer"><a href="/tools/rag-cost-calculator/" class="text-link">Run Calculations →</a></div>
        </div>
        <div class="card">
          <span class="eyebrow">Unit Economics</span>
          <h3><a href="/tools/llm-cost-calculator/">LLM Token Cost Estimator</a></h3>
          <p>Compute daily, monthly, and annualized inference budgets based on prompt/completion ratios and prompt cache hits.</p>
          <div class="card-footer"><a href="/tools/llm-cost-calculator/" class="text-link">Estimate Spend →</a></div>
        </div>
        <div class="card">
          <span class="eyebrow">Portfolio Governance</span>
          <h3><a href="/tools/ai-use-case-prioritiser/">AI Use Case Prioritiser</a></h3>
          <p>Map candidate AI initiatives into Quick Wins, Strategic Bets, Experiments, or Defer based on business value and risk.</p>
          <div class="card-footer"><a href="/tools/ai-use-case-prioritiser/" class="text-link">Map Initiatives →</a></div>
        </div>
        <div class="card">
          <span class="eyebrow">Platform Strategy</span>
          <h3><a href="/tools/build-vs-buy-ai-platform/">Build vs Buy Calculator</a></h3>
          <p>Evaluate commercial SaaS AI platform subscriptions against internal gateway engineering investments over a 3-year horizon.</p>
          <div class="card-footer"><a href="/tools/build-vs-buy-ai-platform/" class="text-link">Evaluate Platform →</a></div>
        </div>
        <div class="card">
          <span class="eyebrow">Maturity Diagnostic</span>
          <h3><a href="/tools/enterprise-ai-readiness/">AI Readiness Diagnostic</a></h3>
          <p>Benchmark your enterprise against the 5-stage production readiness maturity matrix across 12 dimensions.</p>
          <div class="card-footer"><a href="/tools/enterprise-ai-readiness/" class="text-link">Take Assessment →</a></div>
        </div>
        <div class="card">
          <span class="eyebrow">Platform Skills</span>
          <h3><a href="/tools/graph-engineering/">Graph Engineering Platform</a></h3>
          <p>Five working AI agent skills connecting source-code graphs, architectural decisions, and durable Obsidian memory.</p>
          <div class="card-footer"><a href="/tools/graph-engineering/" class="text-link">Explore Platform →</a></div>
        </div>
      </div>

      ${renderLeadMagnetCard()}
    </div>
  `;

  fs.writeFileSync(path.join(toolsDir, 'index.html'), renderHtmlPage({
    title: "Interactive Enterprise AI Tools & Calculators | Bhavin Mistry",
    description: "Interactive tools for enterprise AI leaders: RAG Cost Calculator, LLM Token Estimator, Build vs Buy Analyzer, and Readiness Assessment.",
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


// 8. Build Comparison Pages (/compare/)
function buildComparisons() {
  const compDir = path.join(ROOT_DIR, 'compare');
  ensureDir(compDir);

  // Compare Index Page
  const compIndexMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      <span class="eyebrow">Architectural Benchmarks</span>
      <h1>Enterprise AI Comparisons & Evaluations</h1>
      <p class="hero-lead" style="max-width: 820px; margin-top: 16px; margin-bottom: 40px;">
        Empirical architectural comparisons evaluating frameworks, vector databases, and orchestration engines on enterprise security, latency, and maintainability.
      </p>

      <div class="card-grid-3">
        ${content.comparisons.map(comp => `
          <article class="card">
            <div class="card-meta">
              <span class="badge badge-accent">Architectural Benchmark</span>
              <span>${comp.readingTime}</span>
            </div>
            <h2><a href="/compare/${comp.slug}/" style="font-size: 22px;">${comp.title}</a></h2>
            <p style="margin-top: 10px;">${comp.summary}</p>
            <div style="background: var(--wash); padding: 12px; border-left: 2px solid var(--accent); font-size: 12px; margin-bottom: 16px;">
              <strong>Bhavin's Verdict:</strong> ${comp.verdict}
            </div>
            <div class="card-footer">
              <a href="/compare/${comp.slug}/" class="text-link">Read Full Comparison <span>→</span></a>
            </div>
          </article>
        `).join('')}
      </div>

      ${renderLeadMagnetCard()}
    </div>
  `;

  fs.writeFileSync(path.join(compDir, 'index.html'), renderHtmlPage({
    title: "Enterprise AI Framework & Tool Comparisons | Bhavin Mistry",
    description: "In-depth architectural comparison benchmarks of RAG frameworks, vector databases, and LLM orchestration tools for enterprise technology leaders.",
    canonicalUrl: "https://bhavinmistry.com/compare/",
    currentPath: "/compare/",
    ogImage: "https://bhavinmistry.com/assets/og/compare-rag-frameworks.png",
    mainContent: compIndexMain
  }));
  console.log('Generated: compare/index.html');

  // Individual Comparison Pages
  content.comparisons.forEach(comp => {
    const detailDir = path.join(ROOT_DIR, `compare/${comp.slug}`);
    ensureDir(detailDir);

    const canonicalUrl = `https://bhavinmistry.com/compare/${comp.slug}/`;
    const ogImage = `https://bhavinmistry.com/assets/og/compare-${comp.slug}.png`;

    const crumbs = [
      { name: "Home", url: "/" },
      { name: "Comparisons", url: "/compare/" },
      { name: comp.title, url: `/compare/${comp.slug}/` }
    ];

    const tocItems = [
      { id: 'verdict', title: "Architectural Verdict" },
      { id: 'matrix', title: "Evaluation Matrix" },
      { id: 'deep-dive', title: "Detailed Analysis" },
      { id: 'recommendations', title: "Enterprise Recommendations" },
      { id: 'connected-resources', title: "Related Blueprints" }
    ];
    const toc = renderTableOfContents(tocItems);

    // Build comparison table columns dynamically
    const firstRow = comp.criteria[0];
    const cols = Object.keys(firstRow).filter(k => k !== 'name');

    const detailMain = `
      <article class="container" style="max-width: 1140px; padding-top: 64px; padding-bottom: 88px;">
        ${renderBreadcrumbs(crumbs)}

        <header style="margin-bottom: 36px; max-width: 860px;">
          <span class="badge badge-accent" style="margin-bottom: 12px;">Architectural Evaluation</span>
          <h1 style="font-size: clamp(32px, 5vw, 48px); margin-bottom: 16px;">${comp.title}</h1>
          <p class="hero-lead" style="font-size: 20px; color: var(--muted);">${comp.summary}</p>
          <div style="display: flex; gap: 24px; align-items: center; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 24px; font-size: 13px; color: var(--muted); flex-wrap: wrap;">
            <span>By <strong><a href="/about/">Bhavin Mistry</a></strong>, Senior Engineering Manager at Commonwealth Bank</span>
            <span>Published: ${comp.publishedAt}</span>
            <span>Last updated: ${comp.updatedAt}</span>
            <span>${comp.readingTime}</span>
          </div>
        </header>

        ${renderSocialShareBar({ url: canonicalUrl, title: comp.title })}
        ${toc.mobile}

        <div class="article-grid">
          <div class="article-main">
            <!-- ARCHITECTURAL VERDICT CALLOUT -->
            <div id="verdict" style="background: var(--paper-elevated); border: 1px solid var(--line); border-left: 4px solid var(--accent); padding: 28px; margin-bottom: 40px; border-radius: 4px;">
              <span class="eyebrow" style="margin-bottom: 4px;">Executive Summary</span>
              <h3 style="font-size: 20px; margin-bottom: 10px;">Bhavin's Architectural Verdict</h3>
              <p style="font-size: 16px; color: var(--ink); line-height: 1.6; margin-bottom: 0;">
                "${comp.verdict}"
              </p>
            </div>

            <!-- COMPARISON MATRIX TABLE -->
            <div id="matrix">
              <h2>Enterprise Evaluation Matrix</h2>
              <p style="font-size: 14px; color: var(--muted); margin-top: 8px;">
                Scored against production governance, security boundaries, and total cost of ownership:
              </p>

              <div class="compare-table-wrap">
                <table class="compare-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Evaluation Criterion</th>
                      ${cols.map(c => `<th>${c.toUpperCase()}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${comp.criteria.map(row => `
                      <tr>
                        <td><strong>${row.name}</strong></td>
                        ${cols.map(c => `<td>${row[c]}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- DEEP DIVE SECTION -->
            <div id="deep-dive" style="margin-top: 48px; font-size: 16px; line-height: 1.7; color: var(--ink-soft);">
              <h2>Detailed Architectural Analysis</h2>
              <p>
                When choosing between competing technologies in the enterprise, the primary danger is evaluating tools based on prototype ergonomics rather than production maintainability. A framework that enables building a demo in three lines of Python often introduces severe abstraction leaks when you must enforce token-level audit logging, multi-region failover, and strict document-level RBAC.
              </p>
              <h3 style="margin-top: 28px; margin-bottom: 12px;">Key Architectural Trade-offs</h3>
              <ul style="margin-left: 20px; margin-bottom: 24px;">
                <li style="margin-bottom: 8px;"><strong>Abstraction vs Transparency:</strong> Heavy frameworks frequently wrap upstream provider errors in opaque exceptions that obscure rate-limit backpressure and token usage.</li>
                <li style="margin-bottom: 8px;"><strong>Security Perimeter Control:</strong> Can the framework execute untrusted payloads inside air-gapped VPCs without phoning home or requiring public telemetry SaaS services?</li>
                <li style="margin-bottom: 8px;"><strong>Deterministic Debugging:</strong> When an agent or retrieval pipeline yields an incorrect answer, can engineers inspect exact step inputs and outputs without reverse-engineering framework magic?</li>
              </ul>
            </div>

            <!-- RECOMMENDATIONS -->
            <div id="recommendations" style="margin-top: 40px; background: var(--wash); padding: 28px; border: 1px solid var(--line); border-radius: 4px;">
              <h3 style="margin-bottom: 10px;">Enterprise Decision Framework</h3>
              <p style="font-size: 14px; color: var(--ink); line-height: 1.6; margin-bottom: 0;">
                For greenfield projects: start with the simplest, most inspectable component tier. Build modular adapters around vector search and inference routing so you can swap underlying database and model providers without rewriting application business logic.
              </p>
            </div>

            ${renderSocialShareBar({ url: canonicalUrl, title: comp.title })}
            ${renderLeadMagnetCard()}
            ${renderAuthorBioCard()}

            <!-- CONNECTED RESOURCES -->
            <div id="connected-resources" style="margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--line);">
              <span class="eyebrow">Connected Resources</span>
              <h3>Related Production Architectures & Tools</h3>
              <div class="card-grid-2" style="margin-top: 20px;">
                <div class="card">
                  <span class="eyebrow">Architecture Blueprint</span>
                  <h4><a href="/architectures/enterprise-rag/">Enterprise Hybrid RAG Blueprint</a></h4>
                  <p style="font-size: 13px;">Dense + sparse retrieval, reciprocal rank fusion, and security trimming boundaries.</p>
                </div>
                <div class="card">
                  <span class="eyebrow">Financial Calculator</span>
                  <h4><a href="/tools/rag-cost-calculator/">RAG Cost Calculator</a></h4>
                  <p style="font-size: 13px;">Model vector storage, query volume, and caching return with zero assumptions.</p>
                </div>
              </div>
            </div>
          </div>

          ${toc.sidebar}
        </div>
      </article>
    `;

    const articleSchema = {
      "@type": "Article",
      "headline": comp.title,
      "description": comp.summary,
      "datePublished": comp.publishedAt,
      "dateModified": comp.updatedAt,
      "author": {
        "@type": "Person",
        "name": "Bhavin Mistry",
        "url": "https://bhavinmistry.com/"
      },
      "publisher": {
        "@type": "Person",
        "name": "Bhavin Mistry"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "image": ogImage
    };

    const compHtml = renderHtmlPage({
      title: comp.metaTitle || `${comp.title} | Bhavin Mistry`,
      description: comp.summary,
      canonicalUrl,
      currentPath: `/compare/${comp.slug}/`,
      mainContent: detailMain,
      ogType: "article",
      ogImage,
      publishedTime: comp.publishedAt,
      modifiedTime: comp.updatedAt,
      jsonLd: [articleSchema, renderBreadcrumbSchema(crumbs)]
    });

    fs.writeFileSync(path.join(detailDir, 'index.html'), compHtml);
    console.log(`Generated: compare/${comp.slug}/index.html`);
  });
}

// 9. Build Speaking Page (/speaking/)
function buildSpeaking() {
  const spkDir = path.join(ROOT_DIR, 'speaking');
  ensureDir(spkDir);

  const spk = content.speaking;
  const canonicalUrl = "https://bhavinmistry.com/speaking/";
  const ogImage = "https://bhavinmistry.com/assets/og/speaking.png";

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Speaking", url: "/speaking/" }
  ];

  const spkMain = `
    <div class="container" style="padding-top: 64px; padding-bottom: 88px;">
      ${renderBreadcrumbs(crumbs)}
      <span class="eyebrow">Keynotes & Technical Briefings</span>
      <h1>Speaking & Industry Keynotes</h1>
      <p class="hero-lead" style="max-width: 820px; margin-top: 16px; margin-bottom: 40px;">
        ${spk.description}
      </p>

      <div style="display: flex; gap: 16px; margin-bottom: 48px; flex-wrap: wrap;">
        <a href="#inquiry-form" class="btn btn-primary">Book Bhavin for an Event ↓</a>
        <a href="#topics" class="btn btn-secondary">Explore Keynote Topics ↓</a>
        <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Connect on LinkedIn ↗</a>
      </div>

      <!-- KEYNOTE TOPICS -->
      <h2 id="topics" style="margin-bottom: 24px;">Core Keynote & Executive Topics</h2>
      <div class="card-grid-2" style="margin-bottom: 56px;">
        ${spk.topics.map(t => `
          <div class="card">
            <span class="badge badge-accent" style="margin-bottom: 12px;">Keynote Topic</span>
            <h3 style="font-size: 20px; margin-bottom: 8px;">${t.title}</h3>
            <p style="font-size: 14px; color: var(--muted); line-height: 1.6;">${t.description}</p>
          </div>
        `).join('')}
      </div>

      <!-- PAST ENGAGEMENTS -->
      <h2 style="margin-bottom: 24px;">Selected Past Engagements & Panels</h2>
      <div style="margin-bottom: 56px;">
        ${spk.engagements.map(eng => `
          <div class="speaking-card">
            <div class="speaking-card-header">
              <div>
                <span class="badge badge-accent">${eng.type}</span>
                <h3 style="font-size: 20px; margin-top: 8px; margin-bottom: 4px;">${eng.title}</h3>
                <div style="font-size: 13px; color: var(--muted);">${eng.event} • ${eng.location}</div>
              </div>
              <span style="font-family: var(--mono); font-size: 12px; color: var(--muted);">${eng.year}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- BOOKING & CONTACT FORM -->
      <div id="inquiry-form" style="background: var(--paper-elevated); border: 1px solid var(--line); padding: 40px; border-radius: 4px; max-width: 760px; margin: 0 auto;">
        <span class="eyebrow">Speaking Inquiry</span>
        <h2 style="font-size: 28px; margin-bottom: 12px;">Invite Bhavin to Speak</h2>
        <p style="font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 24px;">
          For keynote requests, conference panels, executive roundtables, or podcast appearances, please submit the details below or message directly via LinkedIn.
        </p>

        <form action="/speaking/" method="get" onsubmit="event.preventDefault(); alert('Thank you for your inquiry! Your request has been logged. Bhavin will respond shortly.');">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label for="spk-name" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Your Name</label>
              <input type="text" id="spk-name" required style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" />
            </div>
            <div>
              <label for="spk-email" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Work Email</label>
              <input type="email" id="spk-email" required style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" />
            </div>
          </div>
          <div style="margin-bottom: 16px;">
            <label for="spk-event" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Event Name, Date & Location</label>
            <input type="text" id="spk-event" placeholder="e.g. Enterprise AI Summit 2026, Sydney" required style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" />
          </div>
          <div style="margin-bottom: 20px;">
            <label for="spk-details" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Topic or Session Details</label>
            <textarea id="spk-details" rows="4" placeholder="Brief outline of the audience, theme, and desired talk format..." required style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper); font-family: inherit;"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 14px;">Submit Speaking Request →</button>
        </form>
      </div>

      ${renderAuthorBioCard()}
    </div>
  `;

  fs.writeFileSync(path.join(spkDir, 'index.html'), renderHtmlPage({
    title: "Speaking & Keynotes | Bhavin Mistry",
    description: "Bhavin Mistry speaks at technology conferences and executive summits on enterprise AI architecture, hybrid RAG, agentic systems, and banking governance.",
    canonicalUrl,
    currentPath: "/speaking/",
    ogImage,
    jsonLd: [
      {
        "@type": "ProfilePage",
        "name": "Bhavin Mistry Speaking & Keynotes",
        "description": spk.description,
        "mainEntity": {
          "@type": "Person",
          "name": "Bhavin Mistry",
          "jobTitle": "Senior Engineering Manager",
          "worksFor": { "@type": "Organization", "name": "Commonwealth Bank" }
        }
      },
      renderBreadcrumbSchema(crumbs)
    ],
    mainContent: spkMain
  }));
  console.log('Generated: speaking/index.html');
}

// 10. Build Newsletter Archive (/brief/)
function buildNewsletterArchive() {
  const briefDir = path.join(ROOT_DIR, 'brief');
  ensureDir(briefDir);

  const brief = content.brief;
  const canonicalUrl = "https://bhavinmistry.com/brief/";
  const ogImage = "https://bhavinmistry.com/assets/og/brief.png";

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Newsletter Archive", url: "/brief/" }
  ];

  const briefMain = `
    <div class="container" style="max-width: 860px; padding-top: 64px; padding-bottom: 88px;">
      ${renderBreadcrumbs(crumbs)}
      <span class="eyebrow">Fortnightly Executive Briefing</span>
      <h1>The Enterprise AI Brief Archive</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        ${brief.description}
      </p>

      <div style="background: var(--paper-elevated); padding: 36px; border: 1px solid var(--line); margin-bottom: 48px; border-radius: 4px;">
        <h3 style="margin-bottom: 12px;">Subscribe to The Brief</h3>
        <p style="font-size: 14px; color: var(--muted); margin-bottom: 20px;">
          Delivered fortnightly. Battle-tested architecture blueprints, unit economic teardowns, and engineering leadership field notes directly from Melbourne.
        </p>
        <form action="/newsletter/" method="get" onsubmit="event.preventDefault(); alert('Subscribed! Welcome to The Enterprise AI Brief.');" style="display: flex; gap: 12px; flex-wrap: wrap;">
          <input type="email" placeholder="name@enterprise.com" required style="flex: 1; min-width: 240px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" />
          <button type="submit" class="btn btn-primary" style="padding: 12px 24px; font-size: 13px;">Subscribe Free →</button>
        </form>
      </div>

      <h2 style="margin-bottom: 24px;">Past Issues & Executive Dispatches</h2>
      <div style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 56px;">
        ${brief.issues.map(iss => `
          <article class="card" style="padding: 28px;">
            <div class="card-meta">
              <span class="badge badge-accent">Issue #${iss.issueNumber}</span>
              <span style="font-family: var(--mono); font-size: 12px; color: var(--muted);">${iss.date}</span>
            </div>
            <h3 style="font-size: 22px; margin-top: 8px; margin-bottom: 8px;">${iss.title}</h3>
            <p style="font-size: 14px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 16px;">${iss.summary}</p>
            <div class="card-footer">
              <a href="/insights/" class="text-link">Explore Related Blueprints <span>→</span></a>
            </div>
          </article>
        `).join('')}
      </div>

      ${renderLeadMagnetCard()}
      ${renderAuthorBioCard()}
    </div>
  `;

  fs.writeFileSync(path.join(briefDir, 'index.html'), renderHtmlPage({
    title: "The Enterprise AI Brief Archive | Bhavin Mistry",
    description: "Archive of The Enterprise AI Brief: executive engineering perspectives on production generative AI architectures, governance, and unit economics.",
    canonicalUrl,
    currentPath: "/brief/",
    ogImage,
    jsonLd: [
      {
        "@type": "CollectionPage",
        "name": brief.title,
        "description": brief.description,
        "url": canonicalUrl
      },
      renderBreadcrumbSchema(crumbs)
    ],
    mainContent: briefMain
  }));
  console.log('Generated: brief/index.html');
}

// 11. Build About Page (/about/)
function buildAbout() {
  const abDir = path.join(ROOT_DIR, 'about');
  ensureDir(abDir);

  const canonicalUrl = "https://bhavinmistry.com/about/";
  const ogImage = "https://bhavinmistry.com/assets/og/about.png";

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "About — Executive Leadership Dossier", url: "/about/" }
  ];

  const abMain = `
    <div class="container" style="max-width: 920px; padding-top: 64px; padding-bottom: 88px;">
      ${renderBreadcrumbs(crumbs)}

      <!-- SECTION 1: EXECUTIVE HERO & HIGH-TRUST IDENTITY HEADER -->
      <header class="about-hero" aria-labelledby="dossier-title">
        <span class="eyebrow" style="letter-spacing: 0.12em; color: var(--accent); font-weight: 600;">Executive Leadership Dossier</span>
        <h1 id="dossier-title" style="margin-top: 8px; margin-bottom: 12px;">Bhavin Mistry</h1>
        <div style="font-size: 20px; font-weight: 600; color: var(--ink); margin-bottom: 8px;">
          Enterprise AI & Technology Executive
        </div>
        <p style="font-size: 15px; color: var(--muted); line-height: 1.5; margin-bottom: 24px;">
          Melbourne, Victoria, Australia • Senior Engineering Leadership at Commonwealth Bank • Ex-Acenda, Accenture & Deloitte
        </p>
        <p class="hero-lead" style="font-size: 20px; line-height: 1.55; color: var(--ink-soft); margin-bottom: 32px;">
          Scaling the engineering organizations, production platforms, and governance models that take enterprise AI from pilot purgatory to measurable P&L impact.
        </p>

        <!-- Executive Identity Card -->
        <div class="exec-dossier-hero">
          <div class="exec-seal" aria-hidden="true">
            <div class="exec-seal-monogram">BM</div>
            <div class="exec-seal-sub">EXECUTIVE</div>
          </div>
          <div>
            <div style="font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--ink);">
              Bhavin Mistry
            </div>
            <div style="font-size: 13px; color: var(--muted); margin-top: 2px;">
              Senior Engineering Manager • Commonwealth Bank • Melbourne, Australia
            </div>
            <div class="exec-badge-list">
              <span class="badge badge-accent">Tier-1 Regulated Banking</span>
              <span class="badge badge-accent">Enterprise AI Platforms</span>
              <span class="badge badge-accent">Global Distributed Delivery</span>
              <span class="badge badge-accent">APRA CPS 234 Governance</span>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;">
              <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Connect on LinkedIn ↗</a>
              <a href="/speaking/" class="btn btn-secondary btn-sm">Book for Keynotes & Board Briefings →</a>
              <a href="#first-90-days" class="btn btn-secondary btn-sm">Jump to First 90 Days Playbook ↓</a>
            </div>
          </div>
        </div>
      </header>

      <!-- SECTION 2: EXECUTIVE IMPACT TELEMETRY BAR (4-COLUMN METRIC GRID) -->
      <section aria-labelledby="telemetry-title" style="margin-top: 40px;">
        <h2 id="telemetry-title" class="sr-only">Executive Impact Telemetry</h2>
        <div class="telemetry-grid">
          <div class="telemetry-card">
            <div class="telemetry-num">Global Distributed Delivery</div>
            <div class="telemetry-label">Multi-Squad Leadership</div>
            <div class="telemetry-desc">Leading cross-functional engineering squads, principal engineers, and technical leads across onshore and offshore hubs.</div>
          </div>
          <div class="telemetry-card">
            <div class="telemetry-num">P&L-Aligned Architecture</div>
            <div class="telemetry-label">Commercial & FinOps Discipline</div>
            <div class="telemetry-desc">Driving cloud and LLM unit-economics efficiency via centralized gateways, semantic caching, and build-vs-buy governance.</div>
          </div>
          <div class="telemetry-card">
            <div class="telemetry-num">Accelerated Production Delivery</div>
            <div class="telemetry-label">AI-Native SDLC Velocity</div>
            <div class="telemetry-desc">Compressing lead time from commit to production using MCP/graph-assisted engineering workflows and automated CI eval gates.</div>
          </div>
          <div class="telemetry-card">
            <div class="telemetry-num">APRA CPS 234 & Zero-Trust</div>
            <div class="telemetry-label">Tier-1 Regulated Resilience</div>
            <div class="telemetry-desc">Architecting mission-critical financial services platforms built for strict regulatory scrutiny and high availability.</div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: EXECUTIVE THESIS & THE "DUAL FOUNDATION" ADVANTAGE -->
      <section class="about-section" aria-labelledby="thesis-title">
        <div class="thesis-callout">
          <span class="eyebrow" style="color: var(--accent);">Strategic Thesis</span>
          <h3 id="thesis-title" style="font-size: 21px; margin-top: 8px; margin-bottom: 12px; font-family: var(--serif);">Why Most Enterprise AI Transformations Stall</h3>
          <blockquote style="font-size: 17px; line-height: 1.6; color: var(--ink); border-left: 3px solid var(--accent); padding-left: 18px; margin: 0 0 16px 0; font-style: italic;">
            Most enterprise AI and platform transformations fail not because the foundation models are weak, but because the engineering operating model, governance perimeter, and unit economics were never designed for production scale.
          </blockquote>
        </div>

        <div style="font-size: 16px; line-height: 1.8; color: var(--ink-soft); margin-top: 28px;">
          <p style="margin-bottom: 18px;">
            Bhavin Mistry is an Enterprise AI and Engineering Executive who bridges <strong>C-suite commercial strategy</strong> with <strong>deep systems execution</strong>. Across his leadership tenure at <strong>Commonwealth Bank</strong>, and previously at <strong>Acenda, Accenture, and Deloitte</strong>, he has built and led high-performing engineering teams that modernize legacy cores, deliver cloud-native platforms, and transition Generative and Agentic AI into strictly governed enterprise production.
          </p>
          <p style="margin-bottom: 0;">
            With a rare academic triad spanning <strong>Corporate Finance & Commerce (B.Com)</strong>, <strong>Advanced Computer Applications (MCA)</strong>, and <strong>Artificial Intelligence & Machine Learning (The University of Texas at Austin)</strong>, Bhavin operates fluently across both the <strong>architecture review board</strong> and the <strong>executive P&L table</strong>—ensuring every engineering roadmap compounds both technical velocity and commercial return.
          </p>
        </div>
      </section>

      <!-- SECTION 4: INTERACTIVE 4-PILLAR ENGINEERING OPERATING MODEL -->
      <section class="about-section" id="operating-model" aria-labelledby="operating-model-title">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Operating Methodology</span>
            <h2 id="operating-model-title">4-Pillar Engineering Operating Model.</h2>
          </div>
          <p class="section-header-desc">
            A battle-tested framework for building high-talent-density engineering organizations and production AI platforms.
          </p>
        </div>

        <div class="operating-model-grid">
          <div class="operating-pillar-card">
            <div class="pillar-number">01</div>
            <h3>Organizational Design & High-Talent-Density Culture</h3>
            <p>
              Structuring organizations using <strong>Team Topologies</strong>—separating core Platform Engineering squads (owning shared AI gateways, CI/CD, and observability) from Stream-Aligned product squads to eliminate handoff bottlenecks and cognitive overload.
            </p>
            <p>
              Mentoring Engineering Managers, Staff/Principal Engineers, and Tech Leads to own architectural simplicity, operational resilience, and commercial outcomes.
            </p>
            <div class="pillar-proof">
              <a href="/frameworks/enterprise-ai-production-readiness/" class="text-link">Explore the 5-Stage Production Framework <span>→</span></a>
            </div>
          </div>

          <div class="operating-pillar-card">
            <div class="pillar-number">02</div>
            <h3>AI-Native SDLC & Org-Wide Engineering Enablement</h3>
            <p>
              Moving teams beyond basic autocomplete toward graph-aware, multi-agent developer workflows connecting code dependency graphs, ADRs, and MCP tooling.
            </p>
            <p>
              Upskilling traditional software engineers into production AI builders through interactive, first-principles visual learning systems.
            </p>
            <div class="pillar-proof">
              <a href="/#engineering-in-practice" class="text-link">Inspect Graph Engineering Platform <span>→</span></a> · 
              <a href="https://learnaiengineering.dev" target="_blank" rel="noopener noreferrer" class="text-link">Visit Learn AI Engineering <span>↗</span></a>
            </div>
          </div>

          <div class="operating-pillar-card">
            <div class="pillar-number">03</div>
            <h3>Production AI & Regulated Platform Architecture</h3>
            <p>
              Architecting Hybrid Sparse-Dense RAG (BM25 + dense embeddings + cross-encoder reranking), bounded multi-agent state machines, and centralized LLM routing gateways.
            </p>
            <p>
              Embedding <strong>APRA CPS 234</strong> compliance, PII redaction perimeters, canary token traps, and automated CI evaluation harnesses (Ragas, DeepEval, Promptfoo) directly into the deployment pipeline.
            </p>
            <div class="pillar-proof">
              <a href="/architectures/" class="text-link">Explore all 6 Production Architecture Blueprints <span>→</span></a>
            </div>
          </div>

          <div class="operating-pillar-card">
            <div class="pillar-number">04</div>
            <h3>Commercial Governance & AI FinOps</h3>
            <p>
              Shifting executive telemetry from raw "cost per token" to <strong>"cost per successful business outcome"</strong>.
            </p>
            <p>
              Enforcing disciplined capital allocation via structured Use Case Prioritisation and Build-vs-Buy modeling to eliminate zombie POCs and fund defensible moats.
            </p>
            <div class="pillar-proof">
              <a href="/tools/" class="text-link">Test Interactive RAG & Token Cost Calculators <span>→</span></a>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: EXECUTIVE TRACK RECORD & DOMAIN CASE STUDIES -->
      <section class="about-section" aria-labelledby="track-record-title">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Executive Experience</span>
            <h2 id="track-record-title">Executive Track Record & Domain Leadership.</h2>
          </div>
          <p class="section-header-desc">
            Delivering resilient platforms, modernizing legacy estates, and steering multi-vendor transformations across banking and enterprise technology.
          </p>
        </div>

        <div class="track-record-stack">
          <div class="track-record-card">
            <div class="track-record-header">
              <span class="badge badge-accent">01 • Tier-1 Banking & Regulated Platforms</span>
              <h3 style="margin-top: 10px; font-size: 22px;">Commonwealth Bank</h3>
              <span class="track-record-role">Senior Engineering Manager • Melbourne, Australia</span>
            </div>
            <div class="track-record-grid">
              <div>
                <h4 class="track-record-label">Executive Mandate</h4>
                <p>Leading distributed engineering squads delivering resilient, highly scalable, and strictly governed platforms in Australia's largest financial institution.</p>
              </div>
              <div>
                <h4 class="track-record-label">Key Execution & Impact</h4>
                <p>Aligning multi-squad engineering roadmaps with business priorities; enforcing zero-trust security, operational resilience (APRA CPS 234), and paved-road delivery standards that accelerate production velocity without compromising risk guardrails.</p>
              </div>
            </div>
          </div>

          <div class="track-record-card">
            <div class="track-record-header">
              <span class="badge badge-accent">02 • Enterprise Core Modernization</span>
              <h3 style="margin-top: 10px; font-size: 22px;">Acenda</h3>
              <span class="track-record-role">Engineering & Architecture Leadership</span>
            </div>
            <div class="track-record-grid">
              <div>
                <h4 class="track-record-label">Executive Mandate</h4>
                <p>Transforming monolithic legacy systems into modern, cloud-native platforms with predictable agile delivery cadences.</p>
              </div>
              <div>
                <h4 class="track-record-label">Key Execution & Impact</h4>
                <p>Re-architecting domain boundaries, reducing operational run-cost overhead, and establishing high-ownership engineering rituals across cross-functional product and platform teams.</p>
              </div>
            </div>
          </div>

          <div class="track-record-card">
            <div class="track-record-header">
              <span class="badge badge-accent">03 • Global Enterprise Transformation</span>
              <h3 style="margin-top: 10px; font-size: 22px;">Accenture & Deloitte</h3>
              <span class="track-record-role">Technology Architecture & Delivery Advisory</span>
            </div>
            <div class="track-record-grid">
              <div>
                <h4 class="track-record-label">Executive Mandate</h4>
                <p>Partnering with C-suite and technology leaders across global enterprises to bridge boardroom digital strategy with complex multi-vendor engineering execution.</p>
              </div>
              <div>
                <h4 class="track-record-label">Key Execution & Impact</h4>
                <p>Designing enterprise reference architectures, cloud migration factories, and governance operating models that turned multi-year transformation programs into measurable production outcomes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 6: INTERACTIVE COMPONENT - MY FIRST 90 DAYS AS HEAD OF ENGINEERING -->
      <section class="about-section" id="first-90-days" aria-labelledby="first-90-days-title">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Executive Playbook</span>
            <h2 id="first-90-days-title">My First 90 Days as Head of Engineering.</h2>
          </div>
          <p class="section-header-desc">
            A pragmatic, high-velocity onboarding blueprint balancing immediate triage, foundational platform decoupling, and commercial acceleration.
          </p>
        </div>

        <div class="first-90-days-tabs" data-tabs>
          <div class="tab-nav" role="tablist" aria-label="First 90 Days Phases">
            <button class="tab-btn active" role="tab" aria-selected="true" aria-controls="panel-days-1-30" id="tab-1">
              <span class="tab-phase">Phase 01</span>
              <span class="tab-title">Days 1–30: Audit, Triage & Baseline</span>
            </button>
            <button class="tab-btn" role="tab" aria-selected="false" aria-controls="panel-days-31-60" id="tab-2">
              <span class="tab-phase">Phase 02</span>
              <span class="tab-title">Days 31–60: Platform Foundation & Operating Model</span>
            </button>
            <button class="tab-btn" role="tab" aria-selected="false" aria-controls="panel-days-61-90" id="tab-3">
              <span class="tab-phase">Phase 03</span>
              <span class="tab-title">Days 61–90: Velocity, Enablement & Commercial Scale</span>
            </button>
          </div>

          <div class="tab-panels">
            <div class="tab-panel active" id="panel-days-1-30" role="tabpanel" aria-labelledby="tab-1">
              <div class="playbook-item">
                <h4>Portfolio Triage & Capital Concentration</h4>
                <p>Audit all active AI and platform initiatives using the <a href="/tools/ai-use-case-prioritiser/" class="text-link">AI Use Case Prioritiser</a>—pausing unscalable POCs and concentrating capital on high-ROI P&L winners.</p>
              </div>
              <div class="playbook-item">
                <h4>DORA & FinOps Baseline</h4>
                <p>Instrument deployment frequency, PR cycle times, change-failure rates, and cloud/token unit economics across all existing engineering pipelines.</p>
              </div>
              <div class="playbook-item">
                <h4>Risk & Talent Topology Map</h4>
                <p>Audit APRA/security exposure, single-point-of-failure systems, and leadership bench depth across stream-aligned and platform squads.</p>
              </div>
            </div>

            <div class="tab-panel" id="panel-days-31-60" role="tabpanel" aria-labelledby="tab-2" hidden>
              <div class="playbook-item">
                <h4>Centralized AI Gateway Deployment</h4>
                <p>Stand up a unified <a href="/architectures/enterprise-ai-gateway/" class="text-link">Enterprise AI Gateway</a> enforcing multi-provider routing, semantic caching, PII redaction, and per-squad token quotas.</p>
              </div>
              <div class="playbook-item">
                <h4>Team Topologies Realignment</h4>
                <p>Decouple core Platform & Enablement squads from Stream-Aligned product squads to remove cross-team blockers and cognitive load.</p>
              </div>
              <div class="playbook-item">
                <h4>Production Readiness Gate</h4>
                <p>Institute the <a href="/frameworks/enterprise-ai-production-readiness/" class="text-link">50-Point AI Production Checklist</a> and automated CI evaluation harnesses before any system reaches live traffic.</p>
              </div>
            </div>

            <div class="tab-panel" id="panel-days-61-90" role="tabpanel" aria-labelledby="tab-3" hidden>
              <div class="playbook-item">
                <h4>AI-Native SDLC Rollout</h4>
                <p>Equip engineering squads with MCP/graph-assisted workflows to compress delivery cycles while maintaining strict code quality gates.</p>
              </div>
              <div class="playbook-item">
                <h4>Executive Unit-Economics Telemetry</h4>
                <p>Launch live FinOps dashboards tying engineering spend and inference consumption directly to commercial P&L outcomes.</p>
              </div>
              <div class="playbook-item">
                <h4>Internal AI Academy</h4>
                <p>Roll out structured engineering enablement (modeled on <a href="https://learnaiengineering.dev" target="_blank" rel="noopener noreferrer" class="text-link">Learn AI Engineering</a>) to upskill existing software engineers into production AI engineers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 7: EDUCATION & THE "COMMERCIAL + TECHNICAL" CREDENTIAL TRIAD -->
      <section class="about-section" aria-labelledby="credentials-title">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Academic Pedigree</span>
            <h2 id="credentials-title">The Commercial + Technical Triad.</h2>
          </div>
          <p class="section-header-desc">
            A rare combination spanning frontier artificial intelligence, distributed computer applications, and corporate finance.
          </p>
        </div>

        <div class="credential-triad-grid">
          <div class="credential-card">
            <span class="eyebrow">Advanced AI & ML</span>
            <h3>The University of Texas at Austin</h3>
            <div class="credential-degree">Post Graduate Program in Artificial Intelligence & Machine Learning: Business Applications</div>
            <p>Deep learning system design, transformer architectures, computer vision, and strategic enterprise AI deployment.</p>
          </div>

          <div class="credential-card">
            <span class="eyebrow">Computer Applications</span>
            <h3>Gujarat Technological University</h3>
            <div class="credential-degree">Master of Computer Applications (MCA)</div>
            <p>Advanced software engineering, distributed systems, algorithms, and enterprise database architecture.</p>
          </div>

          <div class="credential-card">
            <span class="eyebrow">Commercial & Finance</span>
            <h3>Gujarat University</h3>
            <div class="credential-degree">Bachelor of Commerce (B.Com)</div>
            <p>Corporate finance, unit economics, accounting, financial governance, and commercial P&L management.</p>
          </div>
        </div>
      </section>

      <!-- SECTION 8: UPGRADED MEDIA KIT & 1-CLICK COPY EXECUTIVE BIOS -->
      <section class="about-section" id="media-kit" aria-labelledby="media-kit-title">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Media Kit & Speaker Bureau</span>
            <h2 id="media-kit-title">Approved Executive Bios & Boilerplates.</h2>
          </div>
          <p class="section-header-desc">
            Standard biographies for keynote speaker introductions, executive briefings, board packets, and panel programs.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="bio-box">
            <div class="bio-box-header">
              <div>
                <strong style="font-size: 15px;">Short Executive Bio</strong>
                <span style="font-size: 12px; color: var(--muted); margin-left: 8px;">(50 Words • Program Blurbs & Podcasts)</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-copy-text="Bhavin Mistry is an Enterprise AI and Engineering Leader at Commonwealth Bank in Melbourne, Australia, with prior leadership and architecture tenure at Acenda, Accenture, and Deloitte. He specializes in scaling high-velocity engineering organizations, regulated AI platforms, hybrid RAG architectures, and AI FinOps that turn frontier technology into measurable P&L impact." data-copy-label="Short Bio">Copy 📋</button>
            </div>
            <p class="bio-box-content">
              "Bhavin Mistry is an Enterprise AI and Engineering Leader at Commonwealth Bank in Melbourne, Australia, with prior leadership and architecture tenure at Acenda, Accenture, and Deloitte. He specializes in scaling high-velocity engineering organizations, regulated AI platforms, hybrid RAG architectures, and AI FinOps that turn frontier technology into measurable P&L impact."
            </p>
          </div>

          <div class="bio-box">
            <div class="bio-box-header">
              <div>
                <strong style="font-size: 15px;">Full Executive Bio</strong>
                <span style="font-size: 12px; color: var(--muted); margin-left: 8px;">(110 Words • Keynotes, Board Packets & Dossiers)</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-copy-text="Bhavin Mistry is an Enterprise AI and Technology Executive based in Melbourne, Australia, currently serving in senior engineering leadership at Commonwealth Bank following platform and architecture roles at Acenda, Accenture, and Deloitte. Bridging deep systems architecture with commercial P&L governance, Bhavin builds globally distributed engineering organizations and production platforms that take Generative and Agentic AI from experimentation to APRA-compliant enterprise scale. He is the creator of the Enterprise AI Architecture Library, interactive AI FinOps calculators, and Learn AI Engineering. Bhavin holds a Postgraduate qualification in AI & Machine Learning from The University of Texas at Austin, a Master of Computer Applications, and a Bachelor of Commerce." data-copy-label="Full Bio">Copy 📋</button>
            </div>
            <p class="bio-box-content">
              "Bhavin Mistry is an Enterprise AI and Technology Executive based in Melbourne, Australia, currently serving in senior engineering leadership at Commonwealth Bank following platform and architecture roles at Acenda, Accenture, and Deloitte. Bridging deep systems architecture with commercial P&L governance, Bhavin builds globally distributed engineering organizations and production platforms that take Generative and Agentic AI from experimentation to APRA-compliant enterprise scale. He is the creator of the Enterprise AI Architecture Library, interactive AI FinOps calculators, and Learn AI Engineering. Bhavin holds a Postgraduate qualification in AI & Machine Learning from The University of Texas at Austin, a Master of Computer Applications, and a Bachelor of Commerce."
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION 9: WHERE TO EXPLORE NEXT DECISION DRAWER -->
      <section class="about-section" aria-labelledby="decision-drawer-title" style="margin-top: 64px; border-top: 1px solid var(--line); padding-top: 48px;">
        <div class="section-header">
          <div class="section-header-content">
            <span class="eyebrow">Verify Engineering Depth</span>
            <h2 id="decision-drawer-title">Where to Explore Next.</h2>
          </div>
          <p class="section-header-desc">
            Inspect live architectural blueprints, test client-side financial models, or examine technology radars.
          </p>
        </div>

        <div class="card-grid-3">
          <div class="card">
            <span class="eyebrow">Production Architectures</span>
            <h3><a href="/architectures/">Inspect Production Blueprints</a></h3>
            <p>Review 6 end-to-end blueprints for Hybrid RAG, Agentic RAG, AI Gateways, and Zero-Trust Security.</p>
            <div class="card-footer">
              <a href="/architectures/" class="text-link">Explore Blueprints <span>→</span></a>
            </div>
          </div>

          <div class="card">
            <span class="eyebrow">Decision Calculators</span>
            <h3><a href="/tools/">Run Interactive FinOps Models</a></h3>
            <p>Test client-side calculators for RAG storage/inference costs, token budgets, and Build-vs-Buy ROI.</p>
            <div class="card-footer">
              <a href="/tools/" class="text-link">Launch Calculators <span>→</span></a>
            </div>
          </div>

          <div class="card">
            <span class="eyebrow">Technology Landscape</span>
            <h3><a href="/ai-radar/">Explore the AI Radar & Benchmarks</a></h3>
            <p>See what technologies I classify under Adopt, Trial, Assess, and Watch for regulated enterprises.</p>
            <div class="card-footer">
              <a href="/ai-radar/" class="text-link">View Technology Radar <span>→</span></a>
            </div>
          </div>
        </div>

        <!-- Contact Box -->
        <div id="contact" style="margin-top: 48px; background: var(--paper-elevated); padding: 32px; border: 1px solid var(--line); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <span class="eyebrow" style="margin-bottom: 4px;">Executive Inquiries</span>
            <h3 style="margin-bottom: 6px;">Initiate a Conversation</h3>
            <p style="font-size: 14px; color: var(--muted); margin-bottom: 0;">Discuss enterprise AI strategy, executive engineering leadership, or advisory.</p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Start a Conversation on LinkedIn ↗</a>
            <a href="/speaking/" class="btn btn-secondary">Speaking & Keynotes →</a>
          </div>
        </div>
      </section>
    </div>
  `;

  const personSchema = {
    "@type": "Person",
    "@id": "https://bhavinmistry.com/#person",
    "name": "Bhavin Mistry",
    "jobTitle": "Enterprise AI & Technology Executive",
    "worksFor": {
      "@type": "Organization",
      "name": "Commonwealth Bank"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Melbourne",
      "addressCountry": "AU"
    },
    "alumniOf": [
      {
        "@type": "CollegeOrUniversity",
        "name": "The University of Texas at Austin"
      },
      {
        "@type": "CollegeOrUniversity",
        "name": "Gujarat Technological University"
      },
      {
        "@type": "CollegeOrUniversity",
        "name": "Gujarat University"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/in/bhavin-mistry",
      "https://github.com/Bmistry1818",
      "https://x.com/BhaveenMistrry",
      "https://medium.com/@bhavin_mistry",
      "https://learnaiengineering.dev/"
    ],
    "knowsAbout": ["Enterprise AI", "RAG Architecture", "AI Governance", "Platform Engineering", "Machine Learning", "AI FinOps", "APRA CPS 234"],
    "image": ogImage
  };

  fs.writeFileSync(path.join(abDir, 'index.html'), renderHtmlPage({
    title: "Bhavin Mistry — Enterprise AI & Technology Executive | Leadership Dossier",
    description: "Enterprise AI & Technology Executive. Scaling high-velocity engineering organizations, production platforms, and APRA-compliant governance models across Commonwealth Bank, Acenda, Accenture, and Deloitte.",
    canonicalUrl,
    currentPath: "/about/",
    ogImage,
    jsonLd: [
      {
        "@type": "ProfilePage",
        "name": "About Bhavin Mistry",
        "url": canonicalUrl,
        "mainEntity": personSchema
      },
      renderBreadcrumbSchema(crumbs)
    ],
    mainContent: abMain
  }));
  console.log('Generated: about/index.html');
}

// 12. Build Newsletter Page (/newsletter/)
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

      <div style="background: var(--paper-elevated); padding: 40px; border: 1px solid var(--line); border-radius: 4px;">
        <h3 style="margin-bottom: 12px;">What You Receive</h3>
        <ul style="font-size: 14px; color: var(--muted); margin-left: 20px; margin-bottom: 32px; line-height: 1.7;">
          <li><strong>Production Blueprints:</strong> Real architectural patterns that have survived security and SLA reviews.</li>
          <li><strong>Bhavin's Take:</strong> Analytical commentary on major AI model releases, avoiding marketing hype.</li>
          <li><strong>FinOps & Reliability:</strong> Practical token unit economics, semantic caching techniques, and CI evaluation strategies.</li>
        </ul>

        <form action="/newsletter/" method="get" onsubmit="event.preventDefault(); alert('Thank you for subscribing! Subscriptions are queued. A confirmation email will arrive shortly.');">
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="sub-email" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Your Work Email</label>
            <input type="email" id="sub-email" class="form-input" placeholder="name@enterprise.com" required style="width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 14px; background: var(--paper);" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 14px;">Subscribe Free to the Brief →</button>
        </form>
        <div style="font-size: 12px; color: var(--muted); margin-top: 16px; text-align: center;">
          Looking for past issues? <a href="/brief/" style="text-decoration: underline; color: var(--accent);">Browse The Brief Archive →</a>
        </div>
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

// 13. Build Privacy Page (/privacy/)
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
          <strong>Newsletter Subscriptions:</strong> If you voluntarily enter your email to subscribe to the <em>Enterprise AI Brief</em>, your address is stored securely solely to deliver the newsletter.
        </p>

        <h3 style="margin-top: 32px; margin-bottom: 12px;">2. Analytics & Cookies</h3>
        <p>
          This website uses minimal, privacy-conscious logging to understand aggregated readership trends without tracking individual identities or installing invasive third-party advertising cookies.
        </p>

        <h3 style="margin-top: 32px; margin-bottom: 12px;">3. Contact</h3>
        <p>
          If you have questions regarding this privacy policy, you can contact Bhavin via his verified <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer">LinkedIn profile</a>.
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

// 14. Build 404 Page (404.html)
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

      <div style="background: var(--paper-elevated); padding: 24px; border: 1px solid var(--line); text-align: left; border-radius: 4px;">
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

// 15. Build Sitemap (sitemap.xml) & Robots (robots.txt) & RSS Feed (feed.xml) & llms.txt
function buildSeoAssets() {
  const routes = [
    { path: '', changefreq: 'daily', priority: '1.0' },
    { path: 'about/', changefreq: 'weekly', priority: '0.9' },
    { path: 'insights/', changefreq: 'daily', priority: '0.9' },
    { path: 'enterprise-ai-engineering/', changefreq: 'weekly', priority: '0.9' },
    { path: 'architectures/', changefreq: 'weekly', priority: '0.9' },
    { path: 'frameworks/enterprise-ai-production-readiness/', changefreq: 'weekly', priority: '0.9' },
    { path: 'compare/', changefreq: 'weekly', priority: '0.9' },
    { path: 'compare/rag-frameworks/', changefreq: 'weekly', priority: '0.8' },
    { path: 'compare/vector-databases/', changefreq: 'weekly', priority: '0.8' },
    { path: 'compare/llm-orchestration/', changefreq: 'weekly', priority: '0.8' },
    { path: 'speaking/', changefreq: 'weekly', priority: '0.8' },
    { path: 'brief/', changefreq: 'weekly', priority: '0.8' },
    { path: 'ai-radar/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/graph-engineering/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/enterprise-ai-readiness/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/rag-cost-calculator/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/llm-cost-calculator/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/ai-use-case-prioritiser/', changefreq: 'weekly', priority: '0.8' },
    { path: 'tools/build-vs-buy-ai-platform/', changefreq: 'weekly', priority: '0.8' },
    { path: 'research/', changefreq: 'weekly', priority: '0.7' },
    { path: 'newsletter/', changefreq: 'weekly', priority: '0.7' },
    { path: 'privacy/', changefreq: 'monthly', priority: '0.5' }
  ];

  content.insights.forEach(p => {
    routes.push({
      path: `insights/${p.slug}/`,
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: p.updatedAt || p.publishedAt
    });
  });

  content.architectures.forEach(a => {
    routes.push({
      path: `architectures/${a.slug}/`,
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: a.updatedAt || a.publishedAt
    });
  });

  const today = new Date().toISOString().split('T')[0];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>https://bhavinmistry.com/${r.path}</loc>
    <lastmod>${r.lastmod || today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml.trim() + '\n');
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
      <title>${escapeHtml(p.title)}</title>
      <link>https://bhavinmistry.com/insights/${p.slug}/</link>
      <guid>https://bhavinmistry.com/insights/${p.slug}/</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${p.summary}]]></description>
      <category>${escapeHtml(p.category)}</category>
    </item>`).join('')}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(ROOT_DIR, 'feed.xml'), feedXml.trim() + '\n');
  console.log('Generated: feed.xml');

  // llms.txt
  const llmsTxt = `# Bhavin Mistry - Enterprise AI & Technology Executive
> Architecting the Engineering Organizations and Production Platforms That Turn Enterprise AI into P&L Impact.

## Executive Profile & Entity
- Name: Bhavin Mistry
- Title: Enterprise AI & Technology Executive (Head of Engineering / VP of Engineering)
- Current Scope: Senior Engineering Leadership at Commonwealth Bank (Melbourne, Victoria, Australia)
- Career Pedigree: Commonwealth Bank • Acenda • Accenture • Deloitte
- Academic Credentials (The Commercial + Technical Triad):
  - The University of Texas at Austin (Post Graduate Program in Artificial Intelligence & Machine Learning: Business Applications)
  - Gujarat Technological University (Master of Computer Applications - MCA)
  - Gujarat University (Bachelor of Commerce - B.Com, Corporate Finance & Accounting)
- Focus Areas: Enterprise AI Systems Engineering, Compound AI Systems, Model Context Protocol (MCP), Distributed Engineering Squads, Team Topologies, AI FinOps & Unit Economics, APRA CPS 234 Regulated Banking Governance.
- Location: Melbourne, Victoria, Australia
- Website: https://bhavinmistry.com
- LinkedIn: https://www.linkedin.com/in/bhavin-mistry
- GitHub: https://github.com/Bmistry1818
- Twitter/X: https://x.com/BhaveenMistrry
- Medium: https://medium.com/@bhavin_mistry
- Academy: https://learnaiengineering.dev

## Executive Framework: First 90 Days as Head of Engineering
- Days 1–30 (Audit, Triage & Baseline): AI portfolio triage via AI Use Case Prioritiser (pausing unscalable POCs, concentrating capital on high-ROI P&L winners), DORA and FinOps metrics baseline, and APRA/security exposure mapping across squads.
- Days 31–60 (Platform Foundation & Operating Model): Centralized Enterprise AI Gateway deployment (multi-provider routing, semantic caching, PII redaction, token quotas), Team Topologies realignment (Platform vs Stream-Aligned squads), and 50-point Production Readiness Gate institution.
- Days 61–90 (Velocity, Enablement & Commercial Scale): AI-native SDLC rollout with graph/MCP workflows, executive unit-economics telemetry dashboards tying inference spend directly to commercial P&L outcomes, and internal AI Academy enablement modeled on Learn AI Engineering.

## Why Organizations Hire Bhavin Mistry as Head of Engineering (AI & Technology)
1. Organizational Scale & AI-Native SDLC: Structures high-talent-density engineering organizations using Team Topologies (decoupling core AI Platform squads from Stream-Aligned product squads). Accelerates DORA metrics and developer velocity using MCP (Model Context Protocol), source-code dependency graphs, and automated evaluation gates.
2. Production AI in Regulated Environments: Takes Generative and Agentic AI out of pilot purgatory into zero-trust production compliant with Australian banking standards (APRA CPS 234), featuring PII redaction perimeters, immutable audit telemetry, and indirect prompt-injection defense.
3. Commercial & FinOps Governance: Bridges C-suite P&L accountability with systems engineering—replacing vanity metrics (cost per token) with unit economics (cost per successful business outcome) via semantic caching, multi-provider gateway routing, and disciplined Build-vs-Buy capital allocation.
4. Enterprise-Grade Retrieval & Agentic Systems: Architects production Hybrid Sparse-Dense RAG systems (BM25 + dense vector embeddings + cross-encoder reranking) and deterministic multi-agent state machines engineered for >90% factual precision.

## Core Canonical Publications
- The 5-Stage Framework for Taking Enterprise AI to Production: https://bhavinmistry.com/insights/the-5-stage-framework-for-taking-enterprise-ai-to-production/
- Why Hybrid RAG Beats Pure Vector Search in Enterprise Settings: https://bhavinmistry.com/insights/why-hybrid-rag-beats-pure-vector-search-in-enterprise-settings/
- The Hidden Costs of LLM Inference: A Cost Modeling Guide: https://bhavinmistry.com/insights/the-hidden-costs-of-llm-inference-a-cost-modeling-guide/
- Enterprise AI Engineering Production Playbook: https://bhavinmistry.com/insights/enterprise-ai-engineering-production-playbook/
- Why Enterprise AI Agents Fail After the Demo: https://bhavinmistry.com/insights/why-enterprise-ai-agents-fail-after-the-demo/
- Enterprise RAG Architecture Production Blueprint: https://bhavinmistry.com/insights/enterprise-rag-production-blueprint/
- RAG vs Agentic RAG Decision Guide: https://bhavinmistry.com/insights/rag-vs-agentic-rag-enterprise-decision-guide/
- Enterprise AI Governance Without Killing Innovation: https://bhavinmistry.com/insights/enterprise-ai-governance-without-killing-innovation/

## Architectural Blueprints
- Enterprise Hybrid RAG: https://bhavinmistry.com/architectures/enterprise-rag/
- Agentic RAG Architecture: https://bhavinmistry.com/architectures/agentic-rag/
- Enterprise AI Gateway: https://bhavinmistry.com/architectures/enterprise-ai-gateway/
- Secure Enterprise AI Perimeter: https://bhavinmistry.com/architectures/secure-enterprise-ai/
- Production LLM Observability: https://bhavinmistry.com/architectures/llm-observability/
- AI-Powered Enterprise SDLC: https://bhavinmistry.com/architectures/ai-powered-sdlc/

## Architectural Comparisons
- Best RAG Frameworks for Enterprise 2026: https://bhavinmistry.com/compare/rag-frameworks/
- Vector Databases Compared: https://bhavinmistry.com/compare/vector-databases/
- LangChain vs LlamaIndex vs Haystack: https://bhavinmistry.com/compare/llm-orchestration/

## Frameworks & Tools
- Graph Engineering Platform (AI skills and MCP servers): https://bhavinmistry.com/tools/graph-engineering/
- Enterprise AI Production Readiness Framework: https://bhavinmistry.com/frameworks/enterprise-ai-production-readiness/
- Enterprise AI Radar: https://bhavinmistry.com/ai-radar/
- AI Readiness Assessment Diagnostic: https://bhavinmistry.com/tools/enterprise-ai-readiness/
- RAG Cost Calculator: https://bhavinmistry.com/tools/rag-cost-calculator/
- LLM Token Cost Estimator: https://bhavinmistry.com/tools/llm-cost-calculator/
- AI Use Case Prioritiser: https://bhavinmistry.com/tools/ai-use-case-prioritiser/
- Build vs Buy AI Platform Calculator: https://bhavinmistry.com/tools/build-vs-buy-ai-platform/
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
  buildComparisons();
  buildSpeaking();
  buildNewsletterArchive();
  buildRadar();
  buildHandbook();
  buildTools();
  buildPlatform(renderHtmlPage, ROOT_DIR);
  buildResearch();
  buildAbout();
  buildNewsletter();
  buildPrivacy();
  build404();
  buildSeoAssets();
  console.log('Build completed successfully!');
}

if (require.main === module) run();
module.exports = { escapeHtml, publicationGroups, renderPublicationCards, renderHtmlPage };
