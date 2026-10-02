---
name: codebase-ast-to-obsidian-graph
description: Parse Python and TypeScript source into deterministic module, class and function notes with incoming and outgoing Obsidian links.
---

Use `code_graph.generate_code_graph` for the configured source root, or `graph-engineering graph --repo SOURCE --vault VAULT --allow-write`. Graph generation writes managed Code notes; obtain scoped user intent first. Parsing does not execute application code.

Report symbol and edge counts plus unresolved relationships. Python lexical calls and internal module imports are approximations; TypeScript has local symbols, containment, local direct calls and relative module imports, not complete cross-module semantic binding. Do not claim a complete runtime call graph. Syntax errors stop generation before writing. Generated sections preserve handwritten text; stale nodes remain on disk but the active manifest excludes them from retrieval. Narrow the source root if bounds are exceeded; do not silently skip invalid files.
