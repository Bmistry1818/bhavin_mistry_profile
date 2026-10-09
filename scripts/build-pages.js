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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function publicationGroups(blogs = []) {
  const groups = new Map();
  blogs.map(normalizeArticle).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(article => {
    const key = article.title.toLowerCase().replace(/[\s\u2013\u2014]+/g, ' ').trim();
    if (!groups.has(key)) groups.set(key, { ...article, links: [] });
    const group = groups.get(key);
    if (!group.links.some(link => link.url === article.url)) group.links.push({ source: article.source, url: article.url });
  });
  return [...groups.values()];
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
          <h3 id="lead-magnet-title" style="font-size: 22px; margin-bottom: 8px;">The Enterprise AI Production Checklist</h3>
          <p style="font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 0;">
            A rigorous 50-point engineering, security, and FinOps verification gate before promoting Generative AI and Agentic systems to live enterprise traffic.
          </p>
        </div>
        <div>
          <form action="/newsletter/" method="get" onsubmit="event.preventDefault(); alert('Checklist access queued! A confirmation email has been dispatched to your inbox.');" style="display: flex; flex-direction: column; gap: 10px;">
            <input type="email" placeholder="name@enterprise.com" required style="padding: 12px 14px; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; background: var(--paper);" aria-label="Work email address" />
            <button type="submit" class="btn btn-primary" style="padding: 12px; font-size: 13px;">Get Free Production Checklist →</button>
          </form>
          <span style="font-size: 11px; color: var(--muted); display: block; margin-top: 8px; text-align: center;">Zero spam. Fortnightly dispatches. Unsubscribe anytime.</span>
        </div>
      </div>
    </section>
  `;
}

function renderAuthorBioCard() {
  return `
    <div style="margin-top: 48px; padding: 28px; background: var(--paper-elevated); border: 1px solid var(--line); border-radius: 4px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 240px;">
        <span class="eyebrow" style="margin-bottom: 4px;">Author & Engineering Leader</span>
        <h4 style="font-size: 18px; margin-bottom: 6px;">Bhavin Mistry</h4>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.6;">
          Senior Engineering Manager at Commonwealth Bank based in Melbourne, Australia. Focusing on enterprise AI architecture, hybrid RAG, agentic reliability, and technology economics.
        </p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px;">
          <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="text-link">LinkedIn Profile <span>↗</span></a>
          <a href="https://medium.com/@bhavin_mistry" target="_blank" rel="noopener noreferrer" class="text-link">Medium <span>↗</span></a>
          <a href="/about/" class="text-link">Full Leadership Bio <span>→</span></a>
          <a href="/speaking/" class="text-link">Speaking & Keynotes <span>→</span></a>
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
        <span>Bhavin Mistry • Senior Engineering Manager</span>
        <span>Melbourne, Australia</span>
      </div>
      <h1 id="hero-title">Building the teams and platforms that take enterprise AI to <em>production.</em></h1>
      <div class="hero-grid">
        <p class="hero-lead">
          I connect business priorities with engineering strategy, architecture, and delivery. My work spans globally distributed teams, platform transformation, and the governance needed to make AI dependable at enterprise scale.
        </p>
        <div class="hero-actions">
          <div class="btn-group">
            <a href="/about/" class="btn btn-primary">Explore My Leadership</a>
            <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Start a Conversation ↗</a>
          </div>
          <span class="hero-note">Senior Engineering Manager at Commonwealth Bank • Melbourne, Australia</span>
        </div>
      </div>

      <!-- AUTHORITY STATS / PILLARS -->
      <div class="authority-bar">
        <div class="authority-item">
          <div class="authority-label">Current Role</div>
          <div class="authority-value">Engineering Leadership</div>
          <div class="authority-desc">Senior Engineering Manager at Commonwealth Bank.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">Career</div>
          <div class="authority-value">Strategy to Delivery</div>
          <div class="authority-desc">Previous roles at Acenda, Accenture, and Deloitte.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">Leadership Scope</div>
          <div class="authority-value">Global Teams</div>
          <div class="authority-desc">Engineering, architecture, and operating models across distributed teams.</div>
        </div>
        <div class="authority-item">
          <div class="authority-label">AI Focus</div>
          <div class="authority-value">Production AI</div>
          <div class="authority-desc">Secure delivery, governance, and measurable business value.</div>
        </div>
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

    <section class="container platform-feature" aria-labelledby="platform-title">
      <div><span class="eyebrow">Engineering in Practice</span><h2 id="platform-title">Graph Engineering Platform.</h2><p>Five working AI agent skills connecting source-code graphs, architectural decisions and durable Obsidian memory across Codex, Claude and MCP.</p></div>
      <div><span class="badge">Typed source · Native integrations · Inspectable tools</span><a href="/tools/graph-engineering/" class="btn btn-primary">Explore the Platform →</a></div>
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

    <!-- ABOUT SECTION -->
    <section class="section section-wash" aria-labelledby="about-title">
      <div class="container" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 64px; align-items: start;">
        <div>
          <span class="eyebrow">Engineering Leadership</span>
          <h2 id="about-title">Bhavin Mistry.</h2>
          <p style="font-size: 18px; color: var(--ink-soft); line-height: 1.6; margin-top: 16px;">
            Senior Engineering Manager at Commonwealth Bank, with a career spanning AI strategy, platform engineering, architecture, and globally distributed delivery.
          </p>
          <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="/about/" class="btn btn-primary">View Leadership Profile →</a>
            <a href="/speaking/" class="btn btn-secondary">Speaking & Keynotes →</a>
          </div>
        </div>
        <div style="background: var(--paper); padding: 36px; border: 1px solid var(--line);">
          <h4 style="margin-bottom: 12px;">How I Lead</h4>
          <p style="font-size: 14px; color: var(--muted); line-height: 1.7;">
            I work with senior leaders, product teams, and engineers to turn business priorities into delivery roadmaps and dependable services. My approach brings engineering, architecture, and domain expertise together early, with quality and governance built into the operating model.
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

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://bhavinmistry.com/#person",
    "name": "Bhavin Mistry",
    "jobTitle": "Senior Engineering Manager",
    "worksFor": {
      "@type": "Organization",
      "name": "Commonwealth Bank"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Melbourne",
      "addressCountry": "AU"
    },
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "The University of Texas at Austin"
    },
    "sameAs": [
      "https://www.linkedin.com/in/bhavin-mistry",
      "https://github.com/Bmistry1818",
      "https://x.com/BhaveenMistrry",
      "https://medium.com/@bhavin_mistry"
    ],
    "knowsAbout": ["Enterprise AI", "RAG Architecture", "AI Governance", "Platform Engineering", "Machine Learning"],
    "url": "https://bhavinmistry.com/",
    "image": "https://bhavinmistry.com/assets/og/default.png"
  };

  const html = renderHtmlPage({
    title: "Bhavin Mistry | Enterprise AI Engineering Leader",
    description: "Bhavin Mistry is a Senior Engineering Manager at Commonwealth Bank in Melbourne, Australia. Architecture blueprints, hybrid RAG frameworks, and AI leadership.",
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
              <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; margin-bottom: 16px; color: var(--muted-light);">
                <span>SYSTEM TOPOLOGY & DATA FLOW</span>
                <span>ENTERPRISE SPECIFICATION</span>
              </div>
              <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;">
                <rect x="20" y="80" width="130" height="80" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
                <text x="85" y="115" fill="#e8ece9" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Client Application</text>
                <text x="85" y="135" fill="#8d9991" font-family="monospace" font-size="10" text-anchor="middle">RBAC Context</text>

                <path d="M150 120 L220 120" stroke="#9d402b" stroke-width="2" marker-end="url(#arrow)" />

                <rect x="220" y="60" width="170" height="120" rx="4" fill="#2a332e" stroke="#9d402b" stroke-width="1.5" />
                <text x="305" y="95" fill="#f5f2eb" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Security & Gateway</text>
                <text x="305" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">PII Sanitization</text>
                <text x="305" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Semantic Cache Check</text>
                <text x="305" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Rate & Token Budget</text>

                <path d="M390 120 L460 120" stroke="#9d402b" stroke-width="2" />

                <rect x="460" y="60" width="160" height="120" rx="4" fill="#252c28" stroke="#46544c" stroke-width="1.5" />
                <text x="540" y="95" fill="#e8ece9" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">Inference & Rerank</text>
                <text x="540" y="118" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">BM25 + Vector Fusion</text>
                <text x="540" y="136" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Cross-Encoder Top-5</text>
                <text x="540" y="154" fill="#8d9991" font-family="sans-serif" font-size="11" text-anchor="middle">Grounded Synthesis</text>

                <path d="M620 120 L680 120" stroke="#9d402b" stroke-width="2" />

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
    { name: "About", url: "/about/" }
  ];

  const abMain = `
    <div class="container" style="max-width: 860px; padding-top: 64px; padding-bottom: 88px;">
      ${renderBreadcrumbs(crumbs)}
      <span class="eyebrow">Leadership Profile</span>
      <h1>Bhavin Mistry</h1>
      <p class="hero-lead" style="margin-top: 16px; margin-bottom: 32px;">
        Senior Engineering Manager at Commonwealth Bank, based in Melbourne, Australia. Connecting technology strategy, architecture, and engineering delivery across enterprise AI and platform initiatives.
      </p>

      <div style="background: var(--paper-elevated); border: 1px solid var(--line); padding: 32px; margin-bottom: 48px; border-radius: 4px; display: grid; grid-template-columns: 120px 1fr; gap: 32px; align-items: center;">
        <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--wash); border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; font-size: 36px; color: var(--accent); font-family: var(--serif);">
          BM
        </div>
        <div>
          <h3 style="margin-bottom: 6px;">Bhavin Mistry</h3>
          <p style="font-size: 14px; color: var(--muted); margin-bottom: 12px;">
            Senior Engineering Manager • Commonwealth Bank • Melbourne, Victoria, Australia
          </p>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px;">
            <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="text-link">LinkedIn Profile ↗</a>
            <a href="https://github.com/Bmistry1818" target="_blank" rel="noopener noreferrer" class="text-link">GitHub ↗</a>
            <a href="https://x.com/BhaveenMistrry" target="_blank" rel="noopener noreferrer" class="text-link">Twitter / X ↗</a>
            <a href="https://medium.com/@bhavin_mistry" target="_blank" rel="noopener noreferrer" class="text-link">Medium ↗</a>
          </div>
        </div>
      </div>

      <!-- Executive Bio -->
      <h2 style="margin-bottom: 16px;">Executive Bio</h2>
      <div style="font-size: 16px; line-height: 1.75; color: var(--ink-soft); margin-bottom: 48px;">
        <p>
          Bhavin Mistry is an engineering leader with deep expertise across enterprise AI architecture, platform engineering, and high-stakes digital delivery in financial services. Currently serving as Senior Engineering Manager at Commonwealth Bank in Melbourne, he oversees engineering squads delivering robust, highly scalable, and strictly governed platforms.
        </p>
        <p>
          Prior to Commonwealth Bank, Bhavin held engineering and architecture roles at Acenda, Accenture, and Deloitte, partnering with global enterprises to modernize monolithic architectures, implement cloud-native platforms, and establish agile engineering operating models.
        </p>
        <p>
          His technical focus centers on bridging the gap between frontier AI experimentation and dependable production operations: architecting hybrid sparse-dense RAG systems, bounded multi-agent state machines, centralized LLM routing gateways, and automated CI evaluation pipelines aligned with regulatory standards such as APRA CPS 234.
        </p>
      </div>

      <!-- Core Disciplines -->
      <h2 style="margin-bottom: 20px;">Core Engineering Disciplines</h2>
      <div class="card-grid-2" style="margin-bottom: 48px;">
        <div class="card">
          <h4 style="margin-bottom: 8px;">Engineering Strategy & Leadership</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Leading globally distributed squads, aligning technical architectures with P&L targets, and mentoring senior engineering talent.
          </p>
        </div>
        <div class="card">
          <h4 style="margin-bottom: 8px;">Enterprise AI & Hybrid RAG</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Designing dual-index retrieval (BM25 + Dense vector), cross-encoder rerankers, and security-trimmed access control lists.
          </p>
        </div>
        <div class="card">
          <h4 style="margin-bottom: 8px;">Regulated AI Governance</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Implementing immutable trace logging, PII redaction perimeters, canary token traps, and compliance with APRA CPS 234.
          </p>
        </div>
        <div class="card">
          <h4 style="margin-bottom: 8px;">AI FinOps & Unit Economics</h4>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 0;">
            Deploying centralized reverse-proxy gateways, semantic caching in Redis, per-team token quotas, and continuous eval harnesses.
          </p>
        </div>
      </div>

      <!-- Verified Education -->
      <h2 style="margin-bottom: 16px;">Education & Credentials</h2>
      <div style="background: var(--paper-elevated); padding: 28px; border: 1px solid var(--line); margin-bottom: 48px; border-radius: 4px;">
        <span class="eyebrow" style="margin-bottom: 6px;">Executive Education</span>
        <h3 style="font-size: 20px; margin-bottom: 6px;">The University of Texas at Austin</h3>
        <p style="font-size: 15px; color: var(--ink-soft); margin-bottom: 4px;">Post Graduate Program in Artificial Intelligence and Machine Learning: Business Applications</p>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Focused on deep learning system design, transformer architectures, and strategic enterprise AI deployment.</p>
        <div style="border-top: 1px solid var(--line-subtle); padding-top: 16px; font-size: 13px; color: var(--muted);">
          Master of Computer Applications, Gujarat Technological University · Bachelor of Commerce, Gujarat University
        </div>
      </div>

      <!-- MEDIA KIT SECTION -->
      <h2 id="media-kit" style="margin-bottom: 16px;">Media Kit & Event Organizers</h2>
      <p style="font-size: 14px; color: var(--muted); margin-bottom: 24px;">
        Approved biographies, headshots, and boilerplate copy for conference programs, podcast hosts, and panel introductions.
      </p>

      <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 56px;">
        <div style="background: var(--wash); border: 1px solid var(--line); padding: 24px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 14px;">Short Bio (50 words)</strong>
            <button type="button" class="share-btn" data-copy-url="Bhavin Mistry is a Senior Engineering Manager at Commonwealth Bank in Melbourne, Australia. He specializes in enterprise AI architecture, hybrid RAG, and platform engineering, helping organizations take generative AI from experimentation to production.">Copy 📋</button>
          </div>
          <p style="font-size: 13px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 0;">
            "Bhavin Mistry is a Senior Engineering Manager at Commonwealth Bank in Melbourne, Australia. He specializes in enterprise AI architecture, hybrid RAG, and platform engineering, helping organizations take generative AI from experimentation to production."
          </p>
        </div>

        <div style="background: var(--wash); border: 1px solid var(--line); padding: 24px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 14px;">Medium Bio (100 words)</strong>
            <button type="button" class="share-btn" data-copy-url="Bhavin Mistry is a Senior Engineering Manager at Commonwealth Bank based in Melbourne, Australia. His background spans platform engineering, architecture, and technology leadership at Acenda, Accenture, and Deloitte. Bhavin focuses on production enterprise AI: designing hybrid RAG retrieval systems, centralized LLM gateways, and governance frameworks that withstand regulatory scrutiny in financial services. He completed his postgraduate studies in Artificial Intelligence & Machine Learning at The University of Texas at Austin.">Copy 📋</button>
          </div>
          <p style="font-size: 13px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 0;">
            "Bhavin Mistry is a Senior Engineering Manager at Commonwealth Bank based in Melbourne, Australia. His background spans platform engineering, architecture, and technology leadership at Acenda, Accenture, and Deloitte. Bhavin focuses on production enterprise AI: designing hybrid RAG retrieval systems, centralized LLM gateways, and governance frameworks that withstand regulatory scrutiny in financial services. He completed his postgraduate studies in Artificial Intelligence & Machine Learning at The University of Texas at Austin."
          </p>
        </div>
      </div>

      <!-- Contact -->
      <h2 id="contact">Discuss AI Engineering Leadership</h2>
      <p style="font-size: 15px; color: var(--ink-soft); margin-top: 12px;">I welcome conversations about enterprise AI strategy, engineering leadership, and building production-ready platforms.</p>
      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 20px;">
        <a href="https://www.linkedin.com/in/bhavin-mistry" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Start a Conversation on LinkedIn ↗</a>
        <a href="/speaking/" class="btn btn-secondary">Speaking & Keynotes →</a>
        <a href="https://medium.com/@bhavin_mistry" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Read on Medium ↗</a>
      </div>
    </div>
  `;

  const personSchema = {
    "@type": "Person",
    "@id": "https://bhavinmistry.com/#person",
    "name": "Bhavin Mistry",
    "jobTitle": "Senior Engineering Manager",
    "worksFor": {
      "@type": "Organization",
      "name": "Commonwealth Bank"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Melbourne",
      "addressCountry": "AU"
    },
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "The University of Texas at Austin"
    },
    "sameAs": [
      "https://www.linkedin.com/in/bhavin-mistry",
      "https://github.com/Bmistry1818",
      "https://x.com/BhaveenMistrry",
      "https://medium.com/@bhavin_mistry"
    ],
    "knowsAbout": ["Enterprise AI", "RAG Architecture", "AI Governance", "Platform Engineering", "Machine Learning"],
    "image": ogImage
  };

  fs.writeFileSync(path.join(abDir, 'index.html'), renderHtmlPage({
    title: "About Bhavin Mistry | AI Engineering Leadership",
    description: "Leadership profile of Bhavin Mistry, Senior Engineering Manager at Commonwealth Bank. Experience across enterprise AI, platform engineering, and global teams.",
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
  const llmsTxt = `# Bhavin Mistry - Enterprise AI Engineering Authority Platform
> Building Enterprise AI That Actually Reaches Production

## Author & Entity
- Name: Bhavin Mistry
- Focus: Enterprise AI, AI Engineering, Agentic AI, Enterprise RAG, AI Architecture, AI Governance, Financial Services AI
- Location: Melbourne, Australia
- Website: https://bhavinmistry.com
- LinkedIn: https://www.linkedin.com/in/bhavin-mistry
- GitHub: https://github.com/Bmistry1818
- Twitter/X: https://x.com/BhaveenMistrry
- Medium: https://medium.com/@bhavin_mistry

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
