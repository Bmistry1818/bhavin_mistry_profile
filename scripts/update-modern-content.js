const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, '../data/content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

// 1. Update site metadata
content.site.positioning = "Enterprise AI Systems Engineering: From Pilot to Production";
content.site.supportingPositioning = "Architectural blueprints, Model Context Protocol (MCP) infrastructure, and AI FinOps playbooks for Tier-1 regulated enterprises.";

// 2. Modernize AI Radar with 2026 industry realities
const newRadarEntries = [
  {
    id: "model-context-protocol",
    name: "Model Context Protocol (MCP)",
    quadrant: "ADOPT",
    category: "Platform Engineering",
    summary: "Standardized open protocol connecting AI agents securely to enterprise data sources (SQL, GitHub, Jira, Obsidian) with granular RBAC.",
    rationale: "Replaces brittle point-to-point tool integrations with a single composable interface supported across Claude, Cursor, and enterprise agents.",
    implications: "Requires zero-trust internal MCP servers with mTLS authentication, token scope restrictions, and audit logging.",
    risks: "Over-permissioned server scopes exposing internal databases to unverified prompt injection paths."
  },
  {
    id: "continuous-evalops",
    name: "Automated EvalOps in CI/CD",
    quadrant: "ADOPT",
    category: "LLMOps & Quality",
    summary: "Automated regression testing of prompt templates, RAG ground truth, and reasoning chains in pull requests using golden SME benchmarks.",
    rationale: "Vibe-checking prompts in production is untenable in regulated environments; CI eval gates prevent silent degradation.",
    implications: "Engineering teams must curate 100-300 representative test cases with versioned semantic scoring thresholds.",
    risks: "Synthetic judge bias and slow CI build pipelines if running heavy multi-model evaluations on every commit."
  },
  {
    id: "graph-rag",
    name: "GraphRAG & Entity Resolution",
    quadrant: "TRIAL",
    category: "Enterprise Knowledge Retrieval",
    summary: "Augmenting vector embeddings with knowledge graph entity-relation trees (Neo4j / Graphiti) to resolve multi-document corporate relationships.",
    rationale: "Semantic vector similarity fails on tabular account numbers, product hierarchies, and cross-document dependency tracing.",
    implications: "Increases ingestion compute complexity; requires automated entity extraction pipelines.",
    risks: "Graph schema drift and graph extraction hallucination during automated document ingestion."
  },
  {
    id: "dynamic-model-routing",
    name: "Intelligent Model Routing & SLMs",
    quadrant: "TRIAL",
    category: "AI FinOps & Optimization",
    summary: "Dynamic task complexity classifiers routing 70% of routine intent/extraction to low-cost small models (Llama 3.3 / Mistral) and 30% to frontier LLMs.",
    rationale: "Reduces inference spend by 65-80% while cutting P95 time-to-first-token latency to under 250ms for routine enterprise traffic.",
    implications: "Requires latency-aware reverse proxies and automated quality monitoring to catch small model underperformance.",
    risks: "Classification misrouting sending ambiguous reasoning tasks to undersized models."
  }
];

// Deduplicate and prepend modern entries
newRadarEntries.forEach(entry => {
  const existingIdx = content.radar.findIndex(r => r.id === entry.id);
  if (existingIdx >= 0) {
    content.radar[existingIdx] = entry;
  } else {
    content.radar.unshift(entry);
  }
});

// 3. Add Modern Industry Architecture Blueprints
const newArchitectures = [
  {
    slug: "enterprise-mcp-gateway",
    title: "Enterprise Model Context Protocol (MCP) Architecture",
    category: "AI Platform & Tooling",
    summary: "A production-grade blueprint for deploying centralized, zero-trust Model Context Protocol (MCP) gateways connecting coding and operational agents to internal databases and APIs.",
    problem: "Enterprise agents (Claude Code, Cursor, internal custom agents) need access to internal relational databases, git repos, and ticket queues, but direct credential provisioning creates critical security vulnerabilities and credential sprawl.",
    whenToUse: "Deploy when enabling agentic tooling across engineering or operations teams requiring auditable, least-privilege access to core systems of record.",
    whenNotToUse: "Unnecessary for simple conversational bots without external tool calling requirements.",
    components: [
      "MCP Edge Gateway with mTLS Authentication & RBAC token translation",
      "Sandboxed Internal Tool Servers (PostgreSQL, Jira, GitHub, Enterprise Confluence)",
      "Prompt Sanitization & Secret Redaction Proxy",
      "OpenTelemetry Tool Call Audit Span Exporter"
    ],
    dataFlow: "Agent emits standardized JSON-RPC MCP request -> Enterprise MCP Gateway intercepts and validates caller token -> Applies RBAC filter and parameter bounds check -> Invokes internal microservice with short-lived STS credentials -> Sanitizes output before returning context to agent.",
    security: "Enforces zero data retention on external LLM vendors, cryptographic tool signing, and automated parameter validation against schema injection.",
    governance: "Every tool invocation generates an immutable OpenTelemetry audit log including caller identity, sanitized parameters, execution latency, and return status.",
    failureModes: "Downstream tool timeout causing agent hang; mitigated by hard 3.5s circuit-breaker timeout and deterministic error serialization.",
    publishedAt: "2026-09-15",
    updatedAt: "2026-10-01",
    readingTime: "11 min read",
    faqs: [
      {
        q: "Why use MCP instead of traditional REST APIs?",
        a: "MCP provides a standardized protocol for context discovery, dynamic tool registration, and prompt templates, allowing agents to discover and interact with corporate systems without custom SDK wrappers."
      },
      {
        q: "How do you prevent agents from executing destructive database operations?",
        a: "All database MCP servers run under read-only replica connection pools with row-level security (RLS) and query complexity analyzers enforcing hard statement timeouts."
      }
    ],
    codeSnippet: {
      filename: "mcp-gateway-server.ts",
      language: "typescript",
      code: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Enterprise Zero-Trust MCP Server for Banking Knowledge
const server = new Server(
  { name: 'enterprise-mcp-gateway', version: '2.4.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'query_account_ledger',
    description: 'Secure, read-only query against enterprise accounting ledger with RBAC redaction.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', pattern: '^ACC-[0-9]{8}$' },
        auditReason: { type: 'string', minLength: 10 }
      },
      required: ['accountId', 'auditReason']
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'query_account_ledger') {
    const { accountId, auditReason } = request.params.arguments as any;
    // Log security telemetry span
    console.error(\`[AUDIT] Tool invoked: account=\${accountId} reason=\${auditReason}\`);
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'ACTIVE', tier: 'ENTERPRISE_CORE', balanceRedacted: true }) }]
    };
  }
  throw new Error(\`Unsupported tool: \${request.params.name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`
    }
  },
  {
    slug: "graph-rag-knowledge-engine",
    title: "GraphRAG & Knowledge Graph Context Engine",
    category: "Enterprise RAG",
    summary: "Combining Knowledge Graph entity-relation trees with sparse-dense vector retrieval to solve complex cross-document dependencies and eliminate hallucination in domain-specific queries.",
    problem: "Standard vector search relies on naive semantic cosine similarity, which fails completely when answering queries requiring synthesis across 10+ interrelated regulatory policies, corporate entities, or multi-hierarchy documents.",
    whenToUse: "Deploy for financial compliance, loan covenant analysis, clinical trials, or contract intelligence where relational precision is non-negotiable.",
    whenNotToUse: "Do not use for general conversational FAQs or unstructured creative writing where semantic similarity suffices.",
    components: [
      "Entity & Relationship Extraction Engine (LLM-guided entity graph construction)",
      "Graph Database (Neo4j / Memgraph) storing knowledge triplets",
      "Dense Semantic Vector Index (pgvector / Qdrant) with HNSW partitioning",
      "Reciprocal Rank Fusion (RRF) & Cross-Encoder Reranker"
    ],
    dataFlow: "User query parsed for named entities -> Graph traversal extracts 2-hop connected subgraphs -> Parallel dense vector search retrieves semantically similar passages -> RRF merges graph facts with text passages -> Cross-encoder ranks top-5 grounded context blocks.",
    security: "Graph nodes inherit row-level security tags ensuring users only traverse entities they have organizational clearance to inspect.",
    governance: "Every extracted relationship retains direct citation provenance back to source PDF paragraph and revision timestamp.",
    failureModes: "Graph extraction noise during ingestion; mitigated by strict ontology validation against domain entity schemas.",
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-20",
    readingTime: "12 min read",
    faqs: [
      {
        q: "What is the performance overhead of GraphRAG vs standard RAG?",
        a: "Graph traversal adds 18-35ms to retrieval latency, but reduces hallucination rates on complex multi-hop corporate queries from 28% down to under 2.4%."
      }
    ],
    codeSnippet: {
      filename: "graph-hybrid-retriever.py",
      language: "python",
      code: `from typing import List, Dict, Any
import numpy as np

class GraphHybridRetriever:
    """Production GraphRAG retriever combining Neo4j graph traversal with vector similarity."""
    
    def __init__(self, graph_client, vector_store, reranker):
        self.graph = graph_client
        self.vectors = vector_store
        self.reranker = reranker

    async def retrieve(self, query: str, user_roles: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        # 1. Extract entities and traverse 2-hop relation graph
        entities = await self.graph.extract_entities(query)
        graph_triplets = await self.graph.query_subgraph(
            entities=entities, 
            max_depth=2, 
            allowed_roles=user_roles
        )
        
        # 2. Parallel Dense Vector Search
        vector_candidates = await self.vectors.search(query, limit=top_k * 3)
        
        # 3. Reciprocal Rank Fusion (RRF) combining Graph Entities + Text Passages
        combined_pool = self._fuse_candidates(graph_triplets, vector_candidates)
        
        # 4. Cross-Encoder Top-K Grounding
        return self.reranker.rank(query, combined_pool, top_k=top_k)`
    }
  }
];

newArchitectures.forEach(arch => {
  const existingIdx = content.architectures.findIndex(a => a.slug === arch.slug);
  if (existingIdx >= 0) {
    content.architectures[existingIdx] = arch;
  } else {
    content.architectures.push(arch);
  }
});

// 4. Add Modern Industry AI Engineering Insights
const newInsights = [
  {
    slug: "why-95-percent-of-enterprise-ai-pilots-fail-at-the-perimeter",
    title: "Why 95% of Enterprise AI Pilots Fail at the Perimeter (And How to Fix It)",
    category: "AI Systems Engineering",
    readingTime: "11 min read",
    publishedAt: "2026-09-28",
    updatedAt: "2026-10-12",
    summary: "Deconstructing the 5 perimeter failure modes—PII leakage, semantic cache drift, unbudgeted token egress, and permission desync—that kill enterprise GenAI pilots before production.",
    featured: true,
    badge: "Production Playbook",
    tags: ["Enterprise AI", "AI Architecture", "Security Perimeter", "LLM Gateway", "Production Readiness"],
    take: {
      whatHappened: "Over 90% of enterprise AI pilots look brilliant in sandbox demos, but stall for 9-14 months when passing enterprise InfoSec, compliance, and cloud FinOps gatekeepers.",
      whyCare: "Without a hardened perimeter architecture, enterprise AI projects burn executive capital, trigger security review friction, and fail to generate measurable P&L returns.",
      architecturalImpact: "Transitioning from client-side direct SDK calls to a centralized, reverse-proxy AI Gateway with cryptographic tokenization, deterministic guardrails, and real-time semantic caching.",
      whatDoesntChange: "InfoSec and regulatory compliance are not negotiable. AI systems must conform to enterprise security policies, not the other way around.",
      risks: "Allowing shadow AI deployments to hardcode public API credentials inside distributed application repositories.",
      bhavinsTake: "Build the perimeter gateway before you build the application. Once governance, rate limiting, and PII scrubbing are centralized, engineering teams can ship AI features with complete architectural autonomy.",
      whatToDoNext: "Audit your organization against the 5-Stage Enterprise AI Production Readiness Framework and benchmark your gateway latency."
    }
  },
  {
    slug: "enterprise-model-routing-and-slm-distillation",
    title: "The Multi-Model Router: Slashing Enterprise Inference Spend by 78% with SLM Distillation",
    category: "AI FinOps & Optimization",
    readingTime: "10 min read",
    publishedAt: "2026-09-20",
    updatedAt: "2026-10-05",
    summary: "Why routing every query to frontier models is architectural negligence: implementing intent-aware routing between on-prem small models and frontier LLMs with automatic circuit-breakers.",
    featured: true,
    badge: "FinOps Blueprint",
    tags: ["AI FinOps", "Model Routing", "SLM Distillation", "Unit Economics", "Inference Optimization"],
    take: {
      whatHappened: "Enterprise teams often default to flagship frontier models (Claude 3.5 Sonnet, GPT-4o) for every request, burning 80% of their inference budget on mundane classifications and extractions.",
      whyCare: "At enterprise scale, high inference costs destroy SaaS gross margins and trigger executive budget freezes on AI innovation.",
      architecturalImpact: "Implementing an intelligent model router that classifies incoming task complexity in 8ms, dispatching routine requests to low-cost distilled small language models (Llama 3.3 8B, DeepSeek-R1 distilled) and reserving frontier models for high-complexity synthesis.",
      whatDoesntChange: "The unit cost of compute trends toward zero, but total token volume expands exponentially. Smart routing is the only durable margin defense.",
      risks: "Under-provisioning fallback paths when an on-prem small model encounters ambiguous edge cases.",
      bhavinsTake: "Treat models as interchangeable compute engines, not brand choices. A tiered routing architecture cuts enterprise inference bills by 70-85% while drastically improving user latency.",
      whatToDoNext: "Calculate potential savings across your query distribution using our interactive LLM Cost Estimator."
    }
  }
];

newInsights.forEach(ins => {
  const existingIdx = content.insights.findIndex(i => i.slug === ins.slug);
  if (existingIdx >= 0) {
    content.insights[existingIdx] = ins;
  } else {
    content.insights.unshift(ins);
  }
});

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
console.log('Successfully updated data/content.json with cutting-edge 2026 industry AI Engineering content!');

