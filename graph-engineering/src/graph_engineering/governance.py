"""Deterministic rules declared by accepted ADRs; no simulated LLM compliance."""
from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .codegraph import ts_symbols
from .gitutils import git, repository
from .vault import Vault, VaultError, stable_id, wiki


class PolicyRule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=100)
    kind: Literal["forbidden_import", "forbidden_text"]
    value: str = Field(min_length=1, max_length=500)
    paths: list[str] = Field(default_factory=lambda: ["*"], max_length=20)
    severity: Literal["error", "warning"] = "error"
    rationale: str = Field(min_length=1, max_length=1_000)


class Violation(BaseModel):
    file: str
    line: int
    adr: str
    rule: str
    severity: Literal["error", "warning"]
    rationale: str


class ComplianceReport(BaseModel):
    mode: str
    changed_files: list[str]
    rules_checked: int
    violations: list[Violation]
    compliant: bool
    limitation: str = "Only explicit rules in accepted ADRs are enforced. This is not semantic or regulatory certification."


def added_lines(diff: str) -> list[tuple[int, str]]:
    line = 0
    in_hunk = False
    output: list[tuple[int, str]] = []
    for text in diff.splitlines():
        hunk = re.match(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@", text)
        if hunk:
            line = int(hunk.group(1))
            in_hunk = True
        elif in_hunk and text.startswith("+"):
            output.append((line, text[1:]))
            line += 1
        elif in_hunk and text.startswith(" "):
            line += 1
    return output


def imports_with_lines(file: str, source: str) -> list[tuple[int, str]]:
    if file.endswith(".py"):
        nodes = ast.walk(ast.parse(source, filename=file))
        output: list[tuple[int, str]] = []
        for node in nodes:
            if isinstance(node, ast.Import):
                output.extend((node.lineno, alias.name) for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                output.append((node.lineno, "." * node.level + (node.module or "")))
        return output
    if file.endswith((".ts", ".tsx")):
        # Native parser validates syntax; import strings come from import_statement AST nodes.
        _, _, imports = ts_symbols(file, source)
        return [(0, name) for name in imports]  # TS import location unspecified rather than fabricated.
    return []


def check_governance(vault: Vault, repo: str | Path, *, mode: Literal["staged", "worktree", "base"] = "staged", base: str = "HEAD", draft_rfc: bool = False) -> ComplianceReport:
    root = repository(repo)
    if mode == "base":
        if not base or base.startswith("-") or len(base) > 200:
            raise VaultError("Invalid base revision")
        commit = git(root, "rev-parse", "--verify", "--end-of-options", base + "^{commit}").strip()
        arguments = [commit, "HEAD"]
    else:
        arguments = ["--cached"] if mode == "staged" else []
    names = git(root, "diff", *arguments, "--name-only", "--diff-filter=ACMR", "-z").split("\0")
    files = sorted(name for name in names if name)
    if len(files) > 100:
        raise VaultError("More than 100 changed files; split the governance review")
    rules: list[tuple[str, PolicyRule]] = []
    for note in vault.notes("ADRs/"):
        if note.metadata.get("status") != "accepted":
            continue
        policies = note.metadata.get("policies", [])
        if not isinstance(policies, list) or len(policies) > 100:
            raise VaultError("Invalid ADR policy list")
        rules.extend((note.path, PolicyRule.model_validate(policy)) for policy in policies)
        if len(rules) > 500:
            raise VaultError("Governance review exceeds 500 rules; narrow the policy vault")
    violations: list[Violation] = []
    for file in files:
        path = root / file
        if not path.resolve().is_relative_to(root) or path.is_symlink():
            raise VaultError("Changed file escapes repository or is a symlink")
        applicable = [(adr, rule) for adr, rule in rules if any(Path(file).match(pattern) for pattern in rule.paths)]
        diff = git(root, "diff", *arguments, "--no-ext-diff", "--no-textconv", "--unified=0", "--", file)
        added = added_lines(diff)
        imports: list[tuple[int, str]] = []
        if any(rule.kind == "forbidden_import" for _, rule in applicable):
            revision = (":" if mode == "staged" else "HEAD:") + file
            if mode == "worktree":
                if path.stat().st_size > 1_048_576:
                    raise VaultError("Changed source exceeds size limit")
                source = path.read_text(encoding="utf-8")
            else:
                size = int(git(root, "cat-file", "-s", revision).strip())
                if size > 1_048_576:
                    raise VaultError("Changed source exceeds size limit")
                source = git(root, "show", revision)
            imports = imports_with_lines(file, source)
        for adr, rule in applicable:
            matches = [(line, text) for line, text in added if rule.value in text] if rule.kind == "forbidden_text" else [(line, name) for line, name in imports if name == rule.value or name.startswith(rule.value + ".")]
            for line, _ in matches:
                violations.append(Violation(file=file, line=line, adr=adr, rule=rule.id, severity=rule.severity, rationale=rule.rationale))
    violations.sort(key=lambda issue: (issue.file, issue.line, issue.adr, issue.rule))
    report = ComplianceReport(mode=mode, changed_files=files, rules_checked=len(rules), violations=violations, compliant=not any(issue.severity == "error" for issue in violations))
    if draft_rfc and violations:
        body = "# Proposed architecture exception\n\nStatus: proposed; human review required.\n\n## Findings\n"
        body += "\n".join(f"- `{issue.file}:{issue.line}` — {issue.rule}: {issue.rationale} ({wiki(issue.adr)})" for issue in violations)
        body += "\n\n## Alternatives and decision\nNot supplied. Reviewers must document justification before acceptance.\n"
        vault.write(f"RFCs/{stable_id(report.model_dump_json())}.md", {"type": "rfc", "status": "proposed", "managed_by": "graph-engineering"}, body)
    return report
