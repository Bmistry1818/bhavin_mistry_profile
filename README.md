# Bhavin Mistry — Enterprise AI Authority Platform

> **Building Enterprise AI That Actually Reaches Production**
> Practical frameworks, architectures, research, and perspectives on Enterprise AI, AI Engineering, and Agentic Systems by **Bhavin Mistry** (Melbourne, Australia).

Live at: [https://bhavinmistry.com/](https://bhavinmistry.com/)

---

## Architecture Overview

The platform is designed as an ultra-fast, static, zero-dependency editorial engineering platform:
- **Zero Framework Bloat**: Pure semantic HTML5, Vanilla CSS design tokens, and modular vanilla JavaScript.
- **GitHub Pages Native**: Deploys directly from root `/` with zero complex build servers or hosting costs.
- **Blazing Core Web Vitals**: Instant rendering (< 100ms LCP), zero layout shifts (CLS = 0), and instant input readiness.
- **Search & AI Search (GEO)**: Complete JSON-LD structured data (`Person`, `WebSite`, `TechArticle`, `ProfilePage`), `sitemap.xml`, `robots.txt`, `feed.xml` RSS, and machine-readable `llms.txt`.
- **Command Palette & Search**: Accessible via `⌘K` or `Ctrl+K` across all pages.
- **Transparent Decision Tools**: Five client-side interactive calculators and diagnostics with zero external server dependencies.

---

## Information Architecture & Routes

| URL Route | Purpose & Content |
| :--- | :--- |
| `/` | **Platform Homepage**: Content destination featuring Hero, Featured Thinking, Production Readiness Framework, Architecture Library, AI Radar, Decision Tools, and About introduction. |
| `/insights/` | **Insights Engine**: Latest Medium and LinkedIn publications, plus in-depth blueprints and engineering perspectives. |
| `/insights/[slug]/` | **Individual Canonical Articles**: Including Hybrid RAG, Agent Failure Analysis, RAG vs Agentic RAG, AI SDLC Review Agents, and Financial Governance. |
| `/enterprise-ai-engineering/` | **The Enterprise AI Engineering Handbook**: 23-chapter flagship knowledge hub syllabus. |
| `/architectures/` | **AI Architecture Library**: Production blueprints with native responsive SVG diagrams. |
| `/architectures/[slug]/` | **Deep-Dive Architecture Pages**: `enterprise-rag`, `agentic-rag`, `enterprise-ai-gateway`, `secure-enterprise-ai`, `llm-observability`, `ai-powered-sdlc`. |
| `/frameworks/enterprise-ai-production-readiness/` | **Signature Framework**: 5-stage roadmap (Explore, Validate, Govern, Productionise, Scale) and 12-dimension maturity matrix. |
| `/ai-radar/` | **Enterprise AI Radar**: Technology radar tracking Adopt, Trial, Assess, and Watch categories. |
| `/tools/` | **Interactive Tools Hub**: Landing page for all 5 enterprise decision calculators. |
| `/tools/enterprise-ai-readiness/` | **Readiness Assessment Diagnostic**: 18-question diagnostic with dimension breakdowns and printable reports. |
| `/tools/rag-cost-calculator/` | **RAG Cost Calculator**: Working model for queries, embedding tokens, vector storage, and caching savings. |
| `/tools/llm-cost-calculator/` | **LLM Token Cost Estimator**: Daily, monthly, and annualized inference budgets with prompt cache modeling. |
| `/tools/ai-use-case-prioritiser/` | **AI Use Case Prioritiser**: 2x2 matrix categorizing use cases into Quick Wins, Strategic Bets, Experiments, or Defer. |
| `/tools/build-vs-buy-ai-platform/` | **Build vs Buy AI Platform Calculator**: Weighted 10-criteria decision framework. |
| `/research/` | **Research Hub**: Empirical benchmarks, production metrics, and study templates. |
| `/about/` | **Verified Profile**: Factual personal profile, UT Austin PGP in AI/ML credentials, and official links. |
| `/newsletter/` | **Enterprise AI Brief**: Subscription portal with modular email provider architecture. |
| `/privacy/` | **Privacy Policy**: Client-side calculation guarantee and subscription privacy disclosure. |
| `404.html` | **Custom 404 Recovery Page**: Quick-links, search trigger, and command palette integration. |
| `sitemap.xml` | Comprehensive XML sitemap containing all indexable URLs. |
| `robots.txt` | Explicit crawler configuration and sitemap pointer. |
| `feed.xml` | Standard RSS 2.0 / Atom feed for syndication. |
| `llms.txt` | Structured documentation manifest for AI search engines and crawler agents. |

---

## Local Development & Compilation

### Preview Locally:
```sh
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

### Recompiling Pages:
All content is centralized in `data/content.json`. To regenerate all static HTML pages, sitemaps, RSS feeds, and `llms.txt`:
```sh
node scripts/build-pages.js
```
*(Or `bun scripts/build-pages.js`)*

### Validating & Running Tests:
```sh
pnpm test
node --check script.js
node --check scripts/build-pages.js
```

---

## Graph Engineering Platform

The agent tooling showcase is generated at `/tools/graph-engineering/` and linked from the homepage, Tools hub, search and sitemap. The complete local-first Python toolkit is in `graph-engineering/`, with five native skills for Codex and Claude Code, five stdio MCP profiles, typed dispatcher schemas, tests and operating documentation.

Read `graph-engineering/PORTFOLIO_README.md` for setup and boundaries. `node scripts/build-pages.js` also regenerates the full untruncated `SOURCE_FILES.md` and deterministic downloadable ZIP; neither contains a user's vault or host credentials. Installation is opt-in and does not edit host settings. Public deployment already allowlists the `tools/` tree.

## Publication Sync & Deployment

`.github/workflows/update-blogs.yml` runs every six hours, on changes to `main`, and on manual dispatch. It refreshes publications, runs tests, rebuilds the static pages, and publishes public assets to the `gh-pages` branch. GitHub Pages must use **gh-pages / (root)** as its publishing source. The script explicitly requests a Pages build and waits for success because pushes using `GITHUB_TOKEN` do not automatically trigger Pages builds.

Both workflows use shell steps to respect this repository's policy that disallows Actions owned by other accounts. Source changes follow the `main` pull request process; generated site updates do not require a separate content PR.

- **Medium:** Automatically reads `https://medium.com/feed/@bhavin_mistry`. Each scheduled run restores the previous deployment's cache before merging RSS updates, so article history persists across runs beyond the feed's ten-entry window (up to twelve entries per source).
- **LinkedIn:** The former RSS Bridge endpoint is unavailable. Set the `LINKEDIN_RSS_URL` repository secret (or variable for a public URL) to a working RSS/Atom feed from an integration you control. Without it, `data/linkedin-articles.json` supplies verified titles, individual article links, descriptions, and publication dates. This is a curated index, not automatic LinkedIn discovery. LinkedIn's official personal-post API requires approved read permissions.
- **Display:** Recent articles appear on the homepage and at the top of `/insights/`, newest first. Matching article titles on both platforms share a card with both links. External feed text is escaped before rendering.
- **Failures:** A failed source retains its cached articles; failure of all configured feeds stops publication. Source results and the LinkedIn connection status appear in the Actions run summary. Private feed URLs are never logged.

Refresh and rebuild locally:

```sh
node scripts/fetch-blogs.js
node scripts/build-pages.js
node --test
```

For the one-time Pages setup, `node scripts/publish-pages.js --configure` publishes only the allowlisted public assets and changes the Pages source to `gh-pages`. It requires `GITHUB_REPOSITORY=Bmistry1818/bhavin_mistry_profile` and an authorized `GITHUB_TOKEN`; never commit credentials. Routine workflow runs do not change Pages settings.
