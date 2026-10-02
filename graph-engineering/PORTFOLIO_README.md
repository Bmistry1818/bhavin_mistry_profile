# Graph Engineering Platform

## Engineering memory that survives the session

An inspectable, local-first implementation by Bhavin Mistry connecting software delivery, architectural decisions and Obsidian graph memory across Codex, Claude and MCP hosts.

Five focused skills share typed Python engines rather than five divergent implementations. The platform reduces repeated context reconstruction and makes explicit architectural constraints executable. It does **not** promise to eliminate technical debt, capture hidden model memory, or deliver a fixed token reduction. Those outcomes require organization-specific evaluation.

| Capability | Engine | MCP profile | Output |
| --- | --- | --- | --- |
| Zettelkasten agent memory | `memory.py` | `memory` | Atomic ADRs, entity notes and backlinks |
| AST architecture graph | `codegraph.py` | `graph` | Python/TypeScript module and symbol nodes |
| Bounded Graph RAG | `pruner.py` | `retrieval` | Community-ranked two-hop context |
| ADR/RFC governance | `governance.py` | `governance` | Staged-source compliance reports and proposed RFCs |
| Cross-sprint handoff | `handoff.py` | `handoff` | Validated snapshots in UTC daily notes |

## Common installation

From the extracted `graph-engineering` folder, using Python 3.11 or later:

```sh
python3.11 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
export OBSIDIAN_VAULT_PATH="/absolute/path/to/existing/vault"
export GRAPH_REPO_ROOT="/absolute/path/to/codebase"
export GRAPH_ALLOW_WRITE=0
```

Windows: create the same environment and activate `.venv\Scripts\Activate.ps1`; use environment settings appropriate to your shell. GUI hosts need the absolute interpreter path emitted by `scripts/render_mcp_config.py` rather than relying on shell activation. No model API key is needed by these local tools.

## Tabbed GitHub Pages installation template

The portfolio's generated `/tools/graph-engineering/` page implements these tabs with keyboard support and a usable no-JavaScript fallback. This HTML structure is a reusable Pages template; ordinary GitHub Markdown does not execute tab JavaScript. Use the generated page assets for a standalone Pages deployment, or read each installation section below.

<div class="graph-install">
  <div role="tablist" aria-label="Choose agent harness">
    <button type="button" role="tab" id="install-codex" aria-controls="panel-codex" aria-selected="true">Codex</button>
    <button type="button" role="tab" id="install-claude" aria-controls="panel-claude" aria-selected="false">Claude</button>
    <button type="button" role="tab" id="install-mcp" aria-controls="panel-mcp" aria-selected="false">MCP</button>
  </div>
  <section role="tabpanel" id="panel-codex" aria-labelledby="install-codex"><h3>Codex</h3><p>Register the stdio profiles with the supplied .codex/config.toml and discover skills in .agents/skills.</p></section>
  <section role="tabpanel" id="panel-claude" aria-labelledby="install-claude"><h3>Claude</h3><p>Use .claude/skills and .mcp.json for Claude Code. Merge an absolute-path MCP configuration into Claude Desktop settings.</p></section>
  <section role="tabpanel" id="panel-mcp" aria-labelledby="install-mcp"><h3>MCP</h3><p>Launch graph-memory-mcp with an explicit vault, repository and server profile using a stdio-capable host.</p></section>
</div>

### Codex

Launch Codex from the toolkit folder with the activated environment. The project-scoped `.codex/config.toml` registers five stdio servers; the project must be trusted. `.agents/skills` contains the five native skill specifications. When incorporating this toolkit into another repository, merge the MCP table snippets and copy the skill folders without overwriting existing settings.

Alternatively register one unified server using an absolute interpreter:

```sh
codex mcp add graph_engineering --env OBSIDIAN_VAULT_PATH="$OBSIDIAN_VAULT_PATH" --env GRAPH_REPO_ROOT="$GRAPH_REPO_ROOT" --env GRAPH_ALLOW_WRITE=0 -- "$PWD/.venv/bin/python" -m graph_engineering.server --profile all
codex mcp list
```

MCP exposes native tool schemas. `schemas/cli-tools.json` is a dispatcher contract for external orchestrators, **not** a fictional Codex function-registration API. See `configs/codex-context-injection.md` for bounded prompt context and restore usage.

### Claude Code and Desktop

Claude Code uses `.claude/skills/<name>/SKILL.md` and project `.mcp.json`. Start it from the activated environment, with the vault variables set. For GUI-safe absolute paths, print a configuration and manually merge its `mcpServers` entries into the appropriate host settings:

```sh
python scripts/render_mcp_config.py --vault "$OBSIDIAN_VAULT_PATH" --repo "$GRAPH_REPO_ROOT"
```

The script prints configuration only; it never edits host settings. Claude Desktop supports MCP tools but does not load Claude Code's project skill folders as native Desktop skills. Give Desktop the workflow guidance explicitly when needed.

### Generic MCP harness

Configure the absolute executable and environment through your host's stdio manifest. `.mcp.json` is a template using the common `mcpServers` convention; individual hosts may require a different wrapper. The server supports the standard MCP handshake and tool discovery, not every host's proprietary skill-loading format.

```sh
graph-memory-mcp --profile all --vault "$OBSIDIAN_VAULT_PATH" --repo "$GRAPH_REPO_ROOT"
```

The process waits for JSON-RPC on stdin. Do not expect interactive terminal output. Diagnostics use stderr. Remote HTTP serving, authentication and multi-tenant vault access are intentionally outside this local stdio implementation.

## Command reference

```sh
graph-engineering search --vault "$OBSIDIAN_VAULT_PATH" --query "gateway decision" --limit 10
graph-engineering adr --vault "$OBSIDIAN_VAULT_PATH" --input-json examples/adr-input.json --allow-write
graph-engineering backlinks --vault "$OBSIDIAN_VAULT_PATH" --target ADRs/your-decision.md
graph-engineering entity --vault "$OBSIDIAN_VAULT_PATH" --name "Gateway" --fact "Owned by platform" --related ADRs/your-decision --allow-write
python scripts/ast_graph_generator.py --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --allow-write
python scripts/subgraph_pruner.py --vault "$OBSIDIAN_VAULT_PATH" --seed ADRs/your-decision.md --max-bytes 12000 --markdown
python scripts/adr_governance_checker.py --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --mode staged
graph-engineering governance --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --mode base --base main
graph-engineering governance --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --draft-rfc --allow-write
python scripts/context_serializer.py save --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --input-json examples/session-state.json --allow-write
python scripts/context_serializer.py restore --vault "$OBSIDIAN_VAULT_PATH" --note Daily/YYYY-MM-DD.md
```

Notes use YAML frontmatter and `[[vault-relative/wikilinks]]`. Exact paths avoid ambiguous basenames. All mutations require `--allow-write` or `GRAPH_ALLOW_WRITE=1` on the MCP server, plus the host's user-authorization policy. Test with an isolated vault before real adoption.

## Architecture and operational boundaries

```text
Codex / Claude / MCP host
        │  stdio tool calls or explicit CLI arguments
        ▼
Typed engines ─── native Python AST / TypeScript Tree-sitter
        │         read-only Git snapshot collection
        ▼
Bounded vault adapter ─── locks + atomic per-note replacement
        │
        ▼
ADRs · Entities · Code graph · RFCs · Daily handoffs
```

- Read-only by default. Existing Markdown notes are never evaluated as code or trusted instructions.
- Symlink traversal is rejected. Hidden metadata directories are excluded. Local filesystem ownership and permissions are still required; this is not a security boundary against a privileged process racing filesystem changes.
- Writes use per-vault file locking and atomic replacement. A multi-note graph update is not a transaction: retain backups and rerun after interrupted writes. Unmanaged collisions stop updates; handwritten sections outside managed markers are preserved.
- Code graphs preserve stale files for recoverability. `Code/graph-index.md` controls current active nodes, so stale code is excluded from retrieval. Unsupported external imports and dynamic calls are explicitly unresolved.
- Boundaries: 1 MiB per note/source file, 5,000 scanned vault notes, 2,000 source files, 4,000 symbols, 2,000 retrieval nodes, 20,000 retrieval edges, 500 governance rules and 100 changed files. Narrow scope rather than silently truncate analysis.
- Retrieval uses deterministic NetworkX greedy-modularity communities and a two-hop neighborhood. It reports actual byte sizes, not model-token counts. Validate relevance, recall and latency on your own corpus; 70x token reduction is not an established result.
- Governance supports literal forbidden text on added lines and syntactic forbidden imports in changed-file snapshots. TypeScript import reports use line 0 when the exact location is not supplied. No LLM semantics, regulatory guarantees, auto-waivers or automatic ADR acceptance.
- Handoffs preserve supplied fields, validated task trees, HEAD, branch and porcelain Git status; they do not back up uncommitted contents or hidden model state. UTC daily notes append idempotent snapshot blocks. Hashes are integrity checks, not signatures. Redaction is best effort; review input and use your organization's secret scanning.
- Local-first storage does not prevent a hosted model receiving returned excerpts. Keep credentials and regulated information out of the shared vault, apply host approval policies and review data residency before enterprise rollout.

## Verification

```sh
python -m pip install -e '.[dev]'
python -m pytest
python -m mypy src
python scripts/export_integrations.py
```

The test suite exercises ADR idempotence, concurrent entity updates, path and alias rejection, Python/TypeScript parsing, stale-node exclusion, retrieval budgets, staged-index governance, handoff integrity, redaction and an actual MCP stdio client/server handshake. Python 3.11 is the supported minimum. Review current test output rather than treating a marketing badge as certification.

Optional pre-commit integration: merge `configs/pre-commit.yaml` into your existing configuration. If extracted as a standalone repository, change its `entry` to `python scripts/pre_commit_hook.py`. Enable hooks yourself after configuring the environment. The agent-loop equivalent runs the same governance command before proposing a commit, preserving exit-code meaning.

## Official integration references

- [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [MCP Python SDK v1](https://github.com/modelcontextprotocol/python-sdk/tree/v1.x): this toolkit pins the FastMCP-compatible v1 line below v2.
- [TypeScript Tree-sitter grammar](https://github.com/tree-sitter/tree-sitter-typescript)

## Enterprise adoption checklist

Start with a non-sensitive evaluation vault and a small source root. Assign a governance owner, curate accepted policy ADRs, measure retrieval recall and size reductions, verify restore against Git, exercise backups and recovery, pin and scan dependencies, and review host approvals and data residency. Publish real operating evidence before claiming organization-wide readiness or impact.
