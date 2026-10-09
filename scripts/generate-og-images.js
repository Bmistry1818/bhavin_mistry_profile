#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT_DIR = path.join(__dirname, '..');
const OG_DIR = path.join(ROOT_DIR, 'assets/og');

if (!fs.existsSync(OG_DIR)) {
  fs.mkdirSync(OG_DIR, { recursive: true });
}

// Pure Node.js 1200x630 PNG generator
function createPngBuffer(width, height, drawFn) {
  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y, width, height);
      const px = rowOffset + 1 + x * 3;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth 8
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate branded styled OG card PNG
function generateOgCard(filename, { category = 'ENTERPRISE AI', title = 'Bhavin Mistry', subtitle = 'Enterprise AI Engineering Leader' }) {
  // Editorial aesthetic: Dark slate ink (#191F1C) background, accent terracotta (#9D402B) stripe, paper borders
  const png = createPngBuffer(1200, 630, (x, y, w, h) => {
    // Border check (16px border)
    if (x < 16 || x >= w - 16 || y < 16 || y >= h - 16) {
      return [30, 36, 33]; // Outer edge
    }
    // Top terracotta accent bar (y between 16 and 28)
    if (y >= 16 && y <= 28) {
      return [157, 64, 43]; // #9d402b
    }
    // Bottom subtle line (y between 540 and 542)
    if (y >= 540 && y <= 542 && x >= 60 && x <= 1140) {
      return [46, 53, 49]; // #2e3531
    }
    // Main background: subtle dark gradient
    const gradient = Math.floor((y / h) * 12);
    return [25 - gradient, 31 - gradient, 28 - gradient]; // #191f1c base
  });

  fs.writeFileSync(path.join(OG_DIR, filename), png);

  // Also write matching crisp SVG for modern vector display
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#191f1c"/>
  <rect x="0" y="0" width="1200" height="12" fill="#9d402b"/>
  <rect x="40" y="40" width="1120" height="550" stroke="#2e3531" stroke-width="1.5" fill="none"/>
  
  <text x="80" y="110" fill="#9d402b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="3">${escapeXml(category.toUpperCase())}</text>
  
  <text x="80" y="240" fill="#f5f2eb" font-family="'Newsreader', Georgia, serif" font-size="52" font-weight="400">
    ${escapeXml(title)}
  </text>
  
  <text x="80" y="320" fill="#8d9991" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="400">
    ${escapeXml(subtitle)}
  </text>
  
  <line x1="80" y1="520" x2="1120" y2="520" stroke="#2e3531" stroke-width="1"/>
  <text x="80" y="555" fill="#f5f2eb" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600">Bhavin Mistry</text>
  <text x="210" y="555" fill="#7a827b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16">Senior Engineering Manager • Melbourne, Australia</text>
  <text x="1000" y="555" fill="#9d402b" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="600">bhavinmistry.com</text>
</svg>`;

  fs.writeFileSync(path.join(OG_DIR, filename.replace('.png', '.svg')), svg);
}

function escapeXml(unsafe = '') {
  return String(unsafe).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

// Generate all cards
console.log('Generating OpenGraph images in assets/og/...');

// Default / Home
generateOgCard('default.png', { category: 'AUTHORITY PLATFORM', title: 'Bhavin Mistry', subtitle: 'Building Enterprise AI That Actually Reaches Production' });

// Blueprints
generateOgCard('enterprise-rag.png', { category: 'ARCHITECTURE BLUEPRINT', title: 'Enterprise Hybrid RAG Architecture', subtitle: 'Dense + Sparse Retrieval, Reciprocal Rank Fusion & Reranking' });
generateOgCard('agentic-rag.png', { category: 'ARCHITECTURE BLUEPRINT', title: 'Agentic RAG Architecture', subtitle: 'Multi-Hop Query Decomposition & Deterministic Guardrails' });
generateOgCard('enterprise-ai-gateway.png', { category: 'AI PLATFORM', title: 'Enterprise AI Gateway Architecture', subtitle: 'Unified Reverse-Proxy, PII Redaction & Semantic Caching' });
generateOgCard('secure-enterprise-ai.png', { category: 'AI SECURITY', title: 'Secure Enterprise AI Architecture', subtitle: 'Dual-LLM Quarantine & Prompt Injection Defense' });
generateOgCard('llm-observability.png', { category: 'OBSERVABILITY & FINOPS', title: 'Production LLM Observability Stack', subtitle: 'OpenTelemetry Spans, Continuous Evals & Token Accounting' });
generateOgCard('ai-powered-sdlc.png', { category: 'AI-ENABLED SDLC', title: 'AI-Powered Enterprise SDLC', subtitle: 'Architectural Conformance, Automated Review & Quality Gates' });

// Insights & Blog Posts
generateOgCard('the-5-stage-framework-for-taking-enterprise-ai-to-production.png', { category: 'ENTERPRISE AI PLAYBOOK', title: 'The 5-Stage Framework for Production AI', subtitle: 'Escaping Pilot Purgatory from Exploration to Scale' });
generateOgCard('why-hybrid-rag-beats-pure-vector-search-in-enterprise-settings.png', { category: 'ENTERPRISE RETRIEVAL', title: 'Why Hybrid RAG Beats Pure Vector Search', subtitle: 'Overcoming Cosine Blindness with BM25, RRF & Reranking' });
generateOgCard('the-hidden-costs-of-llm-inference-a-cost-modeling-guide.png', { category: 'AI FINOPS & ECONOMICS', title: 'The Hidden Costs of LLM Inference', subtitle: 'A Comprehensive Engineering & Cost Modeling Guide' });
generateOgCard('enterprise-ai-engineering-production-playbook.png', { category: 'FLAGSHIP PERSPECTIVE', title: 'Enterprise AI Engineering Playbook', subtitle: 'Bridging the Gap Between Demos and P&L Realization' });
generateOgCard('why-enterprise-ai-agents-fail-after-the-demo.png', { category: 'AGENTIC RELIABILITY', title: 'Why Enterprise AI Agents Fail After the Demo', subtitle: 'Error Compounding, State Drift & Permission Blindness' });
generateOgCard('enterprise-rag-production-blueprint.png', { category: 'TECHNICAL BLUEPRINT', title: 'Enterprise RAG Production Blueprint', subtitle: 'Security Trimming, Chunking & Reranking at Scale' });
generateOgCard('rag-vs-agentic-rag-enterprise-decision-guide.png', { category: 'DECISION MATRIX', title: 'RAG vs Agentic RAG Decision Guide', subtitle: 'Evaluating When One-Shot RAG Suffices vs Multi-Hop' });
generateOgCard('ai-code-review-agent-engineering-sdlc.png', { category: 'AI SDLC', title: 'AI Code Review Agents in Enterprise SDLC', subtitle: 'Enforcing Architectural Invariants in Pull Requests' });
generateOgCard('enterprise-ai-governance-without-killing-innovation.png', { category: 'REGULATED GOVERNANCE', title: 'AI Governance Without Killing Innovation', subtitle: 'APRA CPS 234 Alignment & Automated Compliance' });

// Comparisons
generateOgCard('compare-rag-frameworks.png', { category: 'ARCHITECTURAL COMPARISON', title: 'Best RAG Frameworks for Enterprise 2026', subtitle: 'LangChain vs LlamaIndex vs Haystack vs Custom Gateway' });
generateOgCard('compare-vector-databases.png', { category: 'DATABASE BENCHMARK', title: 'Vector Databases Compared', subtitle: 'Pinecone vs Weaviate vs pgvector vs Qdrant' });
generateOgCard('compare-llm-orchestration.png', { category: 'ORCHESTRATION BENCHMARK', title: 'LangChain vs LlamaIndex vs Haystack', subtitle: 'Evaluating Determinism, Maintainability & Latency' });

// Hub Pages
generateOgCard('speaking.png', { category: 'KEYNOTES & SESSIONS', title: 'Speaking & Keynotes', subtitle: 'Enterprise AI Architecture & Engineering Leadership' });
generateOgCard('brief.png', { category: 'FORTNIGHTLY BRIEFING', title: 'The Enterprise AI Brief', subtitle: 'Executive Engineering Insights on Production AI' });
generateOgCard('about.png', { category: 'LEADERSHIP PROFILE', title: 'Bhavin Mistry', subtitle: 'Senior Engineering Manager at Commonwealth Bank' });

console.log('Successfully generated all OpenGraph PNG and SVG images.');
