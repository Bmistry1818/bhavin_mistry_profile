---
name: automated-adr-and-rfc-governance
description: Check staged or proposed Git changes against explicit rules in accepted architectural decisions, and draft scoped RFC exceptions when requested.
---

Use `adr_governance.check_adr_governance`, or `graph-engineering governance --repo REPO --vault VAULT --mode staged`. Accepted ADR frontmatter defines exact forbidden-import and forbidden-text rules; see `examples/accepted-adr.md`. Do not interpret free prose as an enforceable rule.

Return file, line (0 means unavailable for a TypeScript import), rule, ADR path and rationale. The import policy checks the complete changed-file snapshot; it may flag existing imports in touched files. Literal text checks inspect only added lines. Malformed accepted rules and parse failures stop the check rather than declaring compliance. Exit codes: 0 no blocking violation, 1 violations, 2 invalid input or failure.

Draft RFCs only when requested and write-enabled. Drafts remain proposed and do not waive violations. Never edit accepted ADRs, stage changes, install hooks or approve an exception without user authorization. No semantic or regulatory certification is implied.
