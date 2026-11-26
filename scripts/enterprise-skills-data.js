const ENTERPRISE_SKILLS = [
  {
    id: 'contract-diff-blast-radius',
    index: '01',
    name: 'Cross-Service Contract & Blast-Radius Diff',
    installPath: '.agents/skills/contract-diff-blast-radius/SKILL.md',
    existingTools: 'git diff · gh / GitLab CLI · OpenAPI / Protobuf / SQL · Existing CI',
    reclaimedHours: 2.4,
    category: 'Distributed APIs & Schemas',
    bottleneck:
      'In 50-500 engineer organizations, modifying a DTO, OpenAPI route, Kafka topic, or database column breaks downstream consumer squads silently, causing multi-day PR review ping-pong and incident rollbacks.',
    nonGenericWhy:
      'Generic "review my PR" prompts miss transitive payload consumers across repositories, ignore serialization/nullability rules, and never enforce expand-and-contract backward compatibility.',
    guardrails: [
      'Scans all references to changed types, Protobuf fields, event schemas, and SQL views before suggesting edits.',
      'Blocks destructive field renames, enum removals, or type narrowing unless an explicit dual-read shim is present.',
      'Generates a downstream Consumer Impact Table directly inside the PR description for reviewer sign-off.'
    ],
    skillMarkdown: `---
name: contract-diff-blast-radius
description: Trace downstream consumers and enforce expand-and-contract compatibility before modifying APIs, schemas, events, or shared DTOs. Trigger on PRs touching OpenAPI, Protobuf, GraphQL, Kafka schemas, or shared models.
---

# Cross-Service Contract & Blast-Radius Diff

## Objective
Prevent silent breaking changes across distributed engineering squads using existing Git history, repo search, and contract test suites.

## Execution Protocol

### 1. Identify Contract Surface Area
Run \`git diff origin/main...HEAD\` (or staged changes) to isolate modifications to:
- HTTP/REST routes, OpenAPI specs, GraphQL SDL, or Protobuf \`.proto\` files
- Event payloads (Kafka/EventBridge/PubSub schemas)
- Database migrations, shared views, or exported SDK DTOs

### 2. Map Downstream Consumers (Read-Only)
- Search monorepo workspaces and cross-repo code search (\`gh search code\`) for every modified symbol, route path, or topic name.
- Group discovered call sites into: **Internal Modules**, **Sibling Squad Services**, and **External / Mobile Clients**.

### 3. Enforce Expand-and-Contract Compatibility
Fail the pre-PR check and refuse to declare readiness if any of the following occur without a versioned shim:
- Removing or renaming a serialized JSON/Protobuf field read by >=1 consumer
- Tightening validation (making optional fields required, narrowing numeric/string bounds)
- Dropping or altering enum member values before consumer cutover

Instead, scaffold the backward-compatible transition:
1. **Expand**: Add nullable new field alongside legacy field with dual-write/fallback mapper.
2. **Verify**: Run existing contract/schema test runner and confirm serialization round-trips.
3. **Log Cleanup Ticket**: Emit follow-up deprecation metadata only after consumer telemetry hits zero.

### 4. Required PR Output Block
Emit a structured Markdown table in the PR summary listing:
\`Contract File | Breaking Risk (None/Additive/Breaking) | Affected Consumers | Mitigation / Shim Applied\``
  },
  {
    id: 'trace-to-commit-incident-triage',
    index: '02',
    name: 'Production Trace-to-Commit Root Cause Triage',
    installPath: '.agents/skills/trace-to-commit-incident-triage/SKILL.md',
    existingTools: 'OpenTelemetry / Datadog / Sentry logs · git log -S · Jira / PagerDuty',
    reclaimedHours: 2.6,
    category: 'On-Call & Reliability Engineering',
    bottleneck:
      'Staff and on-call engineers lose 4-8 hours per incident switching between log indices, deploy manifests, feature flags, and recent commits before isolating the actual defect.',
    nonGenericWhy:
      'Generic "fix this error" prompts hallucinate blind try/catch wrappers around symptoms without correlating deploy timelines, config drift, or tenant blast radius.',
    guardrails: [
      'Strictly read-only until culprit SHA, altered dependency, or feature-flag window is evidenced.',
      'Requires writing a failing minimal reproduction test reproducing the stack trace before editing source.',
      'Produces an explicit rollback vs forward-fix recommendation grounded in blast radius.'
    ],
    skillMarkdown: `---
name: trace-to-commit-incident-triage
description: Correlate production error signatures, OTel traces, and deployment windows against git history to isolate root cause before writing hotfixes.
---

# Production Trace-to-Commit Root Cause Triage

## Objective
Compress incident investigation time using existing logs, traces, and Git commit history without introducing speculative patches.

## Hard Constraints
- Do NOT edit production source files during Phase 1 or Phase 2.
- Never suppress exceptions with broad \`catch\` blocks or fallback nulls to silence alerts.

## Execution Protocol

### 1. Normalize Signal & Time Window
Extract from the incident trace, Sentry payload, or log snippet:
- Exact failing file, line, exception class, and HTTP/RPC status
- First-seen timestamp, deployment SHA / build tag, and affected tenant or region ratio

### 2. Correlate Against Recent Repository Deltas
Run read-only Git inspection over the incident window:
- \`git log --since="<window>" --stat -- <affected_paths>\`
- \`git log -S "<changed_symbol_or_env_key>" -p -n 5\`
- Check config/Helm/Terraform/env changes merged within +/-24h of first occurrence.

### 3. Rank Root Cause Hypotheses With Evidence
Output max 3 ranked hypotheses citing exact commit SHAs, changed lines, and runtime conditions. If logs are insufficient to confirm root cause, stop and specify the exact missing log/metric query rather than guessing.

### 4. Minimal Reproduction First
Write an isolated unit/integration test encoding the exact failing payload/state from logs. Verify it **fails** on current \`HEAD\`, implement the smallest surgical fix, verify green test suite, and report whether \`git revert <sha>\` or forward-fix carries lower customer risk.`
  },
  {
    id: 'compliance-evidence-pr-gate',
    index: '03',
    name: 'Zero-Friction Compliance, AppSec & CAB PR Gate',
    installPath: '.agents/skills/compliance-evidence-pr-gate/SKILL.md',
    existingTools: 'git diff · Jira / Linear · semgrep / gitleaks / trivy · Existing CI',
    reclaimedHours: 2.0,
    category: 'Regulated FinTech & AppSec Governance',
    bottleneck:
      'Regulated mid-to-large teams (APRA CPS 234, SOC 2, HIPAA, ISO 27001) sacrifice 25-35% of sprint throughput writing Change Advisory Board forms and fixing late-stage AppSec review rejections.',
    nonGenericWhy:
      'Generic AI code reviewers praise formatting while missing PII log leaks, tenant authorization bypasses (IDOR), unpinned containers, and missing audit trails.',
    guardrails: [
      'Inspects diffs against 6 concrete AppSec invariants: authz, PII logging, secret/KMS usage, SQLi/SSRF, dependency license delta, and rollback safety.',
      'Extracts Jira acceptance traceability directly from branch/commit metadata.',
      'Outputs an auditor-ready Change Evidence Pack ready to paste into Jira or ServiceNow.'
    ],
    skillMarkdown: `---
name: compliance-evidence-pr-gate
description: Audit PR diffs for authorization boundaries, PII logging, secrets, and dependency risk while generating CAB/Jira release evidence automatically.
---

# Zero-Friction Compliance, AppSec & CAB PR Gate

## Objective
Shift AppSec and Change Advisory Board (CAB) evidence generation into local development and PR preparation using existing Git, CI scanners, and issue trackers.

## Security & Governance Checklist (Inspect Every Changed File)
1. **Authentication & Tenant Isolation**: Verify every new or modified endpoint/resolver checks caller identity AND resource ownership (prevent IDOR / horizontal privilege escalation).
2. **PII & Secret Hygiene**: Flag raw tokens, email/TFN/PAN patterns, or request bodies passed into \`console.log\`, structured logs, or LLM prompts without redaction middleware.
3. **Supply Chain & License Guard**: Inspect lockfile/manifest diffs (\`package-lock.json\`, \`requirements.txt\`, \`go.mod\`) for unapproved licenses or unpinned external container digests.
4. **Destructive Migration / Config Risk**: Confirm feature flags, DB locks, and IAM permission widenings have an explicit non-destructive rollback step.

## Existing CI Verification
Run existing repository security checks before summarizing (\`gitleaks detect\`, \`semgrep\`, \`npm audit\`, or configured SAST script) and cite actual pass/fail counts.

## Auditor-Ready Output Format
Emit a **Change Evidence Pack**:
- Linked Work Item & Acceptance Criteria Coverage
- Security Boundary Summary (Authz / PII / Secrets / Dependencies: \`PASS\` or \`ACTION REQUIRED\` with file:line)
- Rollback & Blast-Radius Plan (1-click toggle, revert SHA, or schema rollback procedure)`
  },
  {
    id: 'strangler-fig-characterization-harness',
    index: '04',
    name: 'Strangler-Fig Legacy Extraction & Parity Harness',
    installPath: '.agents/skills/strangler-fig-characterization-harness/SKILL.md',
    existingTools: 'pytest / junit / vitest / go test · API Gateway / Proxy · Fixture sanitizer',
    reclaimedHours: 2.2,
    category: 'Legacy Modernization & Migrations',
    bottleneck:
      'Enterprise teams remain locked inside brittle 5-to-15 year monoliths because undocumented edge cases make clean-slate rewrites stall after 12 months with production regressions.',
    nonGenericWhy:
      'Generic "refactor this class" prompts silently change rounding behavior, null coercion, timezone handling, or error status codes relied upon by upstream billing/downstream batch jobs.',
    guardrails: [
      'Prohibits rewriting target logic before golden characterization tests capture existing legacy outputs verbatim.',
      'Automatically strips PII from captured payloads before writing checked-in regression fixtures.',
      'Generates shadow-read parity comparison wrappers so teams switch traffic incrementally.'
    ],
    skillMarkdown: `---
name: strangler-fig-characterization-harness
description: Safely extract brittle monolith or legacy workflows using PII-scrubbed characterization tests and shadow-read parity verification before cutover.
---

# Strangler-Fig Legacy Extraction & Parity Harness

## Objective
Turn multi-quarter risky monolith rewrites into incremental, parity-verified weekly releases without pausing feature roadmap delivery.

## Strict 3-Phase Execution Protocol

### Phase 1: Lock Down Existing Behavior (Characterization First)
- Identify all callers, side effects (DB writes, queue emits, external webhooks), and edge cases (empty inputs, DST/timezone boundaries, decimal rounding) of the target legacy slice.
- Sanitize any real/staging fixture data (replace emails, IDs, tokens, names with synthetic equivalents).
- Write golden **characterization tests** asserting the legacy implementation's *exact current outputs* (including quirks) using the repository's native test framework. Verify all pass before modifying target logic.

### Phase 2: Build Extracted Module Behind Parity Boundary
- Implement the replacement module behind an explicit interface matching the legacy seam.
- Scaffold a **shadow-compare / dual-read wrapper** (behind a config flag) that invokes legacy as system-of-record, compares output structurally against the extracted module, and logs mismatch diffs without impacting live responses.

### Phase 3: Cutover Readiness Gate
Require:
- 100% golden characterization test parity
- Zero unresolved semantic diffs on boundary cases (document any intentional bug fixes explicitly with sign-off)
- Reversible routing toggle to fall back to legacy in <60 seconds.`
  },
  {
    id: 'query-plan-unit-cost-profiler',
    index: '05',
    name: 'Pre-Merge Query Plan & Cloud/LLM Unit-Cost Guard',
    installPath: '.agents/skills/query-plan-unit-cost-profiler/SKILL.md',
    existingTools: 'Postgres/Snowflake EXPLAIN · ORM Migrations · OTel / Token telemetry',
    reclaimedHours: 1.8,
    category: 'FinOps, Data & Inference Performance',
    bottleneck:
      'AI-generated ORM code and agent loops quietly introduce N+1 queries, unindexed sequential table scans, and unbounded LLM retry fan-outs that inflate cloud and token spend post-deploy.',
    nonGenericWhy:
      'Generic optimization advice ("add caching") skips actual cardinality math, composite index column order, and worst-case agent token amplification under production concurrency.',
    guardrails: [
      'Detects nested async/DB calls inside loops (N+1) and missing foreign-key/filter composite indexes.',
      'Runs `EXPLAIN (ANALYZE, BUFFERS)` or warehouse cost estimation rules when DB connection/migrations exist.',
      'Calculates worst-case token & compute multiplier across retry/fan-out loops before merge.'
    ],
    skillMarkdown: `---
name: query-plan-unit-cost-profiler
description: Inspect PR diffs touching SQL, ORM queries, batch pipelines, or LLM client loops to catch N+1 patterns, missing indexes, and runaway token/cloud unit costs pre-merge.
---

# Pre-Merge Query Plan & Cloud/LLM Unit-Cost Guard

## Objective
Stop P95 latency regressions and surprise cloud/inference bill spikes before code leaves the developer branch.

## Execution Protocol

### 1. Scan for Latency & Spend Multipliers
Inspect changed files touching SQL, ORMs (Prisma, SQLAlchemy, TypeORM, Hibernate), Spark/dbt pipelines, or AI gateway clients for:
- **N+1 Query Patterns**: Database or HTTP fetches executed inside \`.map()\`, \`for\`, or \`Promise.all\` batches without eager join / DataLoader batching.
- **Unindexed Filtering / Sorting**: \`WHERE\` / \`ORDER BY\` predicates on high-cardinality columns lacking matching composite index order.
- **Unbounded AI / Vector Fan-Out**: Agent loops lacking hard \`max_steps\`, token budget ceilings, prompt-cache prefix ordering, or batch embeddings.

### 2. Run Query Plan Verification (Where Configured)
- Execute local/CI query plan check (\`EXPLAIN (ANALYZE, BUFFERS)\`) or dry-run cost estimator if DB tooling is available; flag \`Seq Scan\` on multi-million-row tables.
- Model projected monthly cost impact at target QPS (1x baseline vs 5x peak burst).

### 3. Deliver Drop-In Remediation
Provide exact SQL migration (\`CREATE INDEX CONCURRENTLY ...\`), batched query rewrite, or bounded router/cache fix alongside the before/after complexity delta (\`O(N) queries -> O(1) batched query\`).`
  }
];

module.exports = { ENTERPRISE_SKILLS };
