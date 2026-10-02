from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from graph_engineering.cli import main
from graph_engineering.codegraph import extract_graph, generate_graph
from graph_engineering.governance import added_lines, check_governance
from graph_engineering.handoff import SessionState, TaskState, restore_context, serialize_context
from graph_engineering.memory import ADRInput, create_adr, query_backlinks, search_vault, update_entity_node
from graph_engineering.pruner import prune
from graph_engineering.server import build_server
from graph_engineering.vault import Vault, VaultError, decode_note, stable_id


@pytest.fixture
def vault(tmp_path: Path) -> Vault:
    root = tmp_path / "vault"
    root.mkdir()
    return Vault(root, writable=True)


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    root = tmp_path / "repo"
    root.mkdir()
    for args in (["init"], ["config", "user.name", "Test"], ["config", "user.email", "test@example.test"]):
        subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)
    (root / "app.py").write_text("def run():\n    return 1\n")
    subprocess.run(["git", "-C", str(root), "add", "."], check=True)
    subprocess.run(["git", "-C", str(root), "commit", "-m", "fixture"], check=True, capture_output=True)
    return root


def test_adr_search_backlinks_and_idempotence(vault: Vault) -> None:
    entity = update_entity_node(vault, "Gateway", ["Owned by platform"], [])
    adr = ADRInput(title="Gateway boundary", context="Avoid uncontrolled egress", decision="Use the gateway", consequences="Central dependency", entities=[entity])
    path = create_adr(vault, adr)
    assert create_adr(vault, adr) == path
    assert query_backlinks(vault, entity) == [path]
    assert search_vault(vault, "gateway")[0].path == path
    changed = adr.model_copy(update={"decision": "Different decision"})
    with pytest.raises(VaultError, match="different content"):
        create_adr(vault, changed)


def test_path_traversal_symlinks_and_readonly(vault: Vault, tmp_path: Path) -> None:
    for path in ("../escape.md", "/tmp/escape.md", ".aws/credentials.md", "not-json.json"):
        with pytest.raises(VaultError):
            vault.write(path, {}, "bad")
    outside = tmp_path / "outside"
    outside.mkdir()
    (vault.root / "escape").symlink_to(outside, target_is_directory=True)
    with pytest.raises(VaultError, match="Symlink"):
        vault.write("escape/test.md", {}, "bad")
    with pytest.raises(VaultError, match="disabled"):
        Vault(vault.root).write("Entities/test.md", {}, "bad")
    assert not list(outside.iterdir())


def test_entity_updates_preserve_manual_text_and_concurrency(vault: Vault) -> None:
    path = update_entity_node(vault, "API", ["First fact"], [])
    note = vault.read(path)
    vault.write(path, note.metadata, note.body + "\n## Human annotation\nKeep me", overwrite=True)
    def update(index: int) -> str:
        return update_entity_node(Vault(vault.root, writable=True), "API", [f"Fact {index}"], [])
    with ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(update, range(8)))
    body = vault.read(path).body
    assert "Keep me" in body
    assert all(f"Fact {index}" in body for index in range(8))


def test_ambiguous_links_fail_closed(vault: Vault) -> None:
    vault.write("ADRs/one.md", {}, "[[same]]")
    vault.write("A/same.md", {}, "A")
    vault.write("B/same.md", {}, "B")
    with pytest.raises(VaultError, match="ambiguous"):
        query_backlinks(vault, "same")


def test_frontmatter_alias_rejection() -> None:
    with pytest.raises(VaultError, match="aliases"):
        decode_note("bad.md", "---\nx: &x [a]\ny: *x\n---\nbody")


def test_python_and_typescript_graph_is_deterministic(vault: Vault, repo: Path) -> None:
    (repo / "helpers.py").write_text("def helper():\n    return 2\n")
    (repo / "app.py").write_text("from helpers import helper\nclass Service:\n    def run(self):\n        return helper()\n")
    (repo / "types.ts").write_text("export class User { id: number = 1; }\n")
    (repo / "service.ts").write_text("import { User } from './types';\nfunction load() { return 1; }\nexport const run = () => load();\n")
    graph = generate_graph(vault, repo)
    assert graph == extract_graph(repo)
    assert {symbol.language for symbol in graph.symbols} == {"python", "typescript"}
    assert {edge.kind for edge in graph.edges} == {"contains", "imports", "calls"}
    source = next(symbol for symbol in graph.symbols if symbol.name == "Service.run")
    assert any(edge.source == source.id and edge.kind == "calls" for edge in graph.edges)
    path = f"Code/{source.id}.md"
    old = vault.read(path)
    vault.write(path, old.metadata, old.body + "\nHandwritten note", overwrite=True)
    generate_graph(vault, repo)
    assert "Handwritten note" in vault.read(path).body


def test_invalid_syntax_causes_no_graph_writes(vault: Vault, repo: Path) -> None:
    (repo / "broken.ts").write_text("function broken( { return")
    with pytest.raises(VaultError, match="syntax"):
        generate_graph(vault, repo)
    assert not (vault.root / "Code").exists()


def test_graph_preflights_unmanaged_index(vault: Vault, repo: Path) -> None:
    vault.write("Code/graph-index.md", {}, "Human-owned index")
    with pytest.raises(VaultError, match="unmanaged"):
        generate_graph(vault, repo)
    assert vault.read("Code/graph-index.md").body == "Human-owned index\n"
    assert len(list(vault.notes("Code/"))) == 1


def test_stale_generated_nodes_are_not_retrieved(vault: Vault, repo: Path) -> None:
    first = generate_graph(vault, repo)
    old = next(symbol for symbol in first.symbols if symbol.name == "run")
    (repo / "app.py").write_text("def replacement():\n    return 1\n")
    updated = generate_graph(vault, repo)
    current = next(symbol for symbol in updated.symbols if symbol.name == "replacement")
    result = prune(vault, [f"Code/{current.id}.md"])
    assert f"Code/{old.id}.md" not in result.selected_paths
    assert (vault.root / f"Code/{old.id}.md").exists()


def test_pruner_two_hop_budget_and_prefix(vault: Vault) -> None:
    for label, body in {"a": "[[ADRs/b]]", "b": "[[ADRs/c]]", "c": "[[ADRs/d]]", "d": "far away"}.items():
        vault.write(f"ADRs/{label}.md", {"title": label}, body)
    result = prune(vault, ["ADRs/a.md"], max_bytes=1000)
    assert result.selected_paths == ["ADRs/a.md", "ADRs/b.md", "ADRs/c.md"]
    assert "ADRs/d.md" not in result.selected_paths
    assert result.context_bytes <= 1000
    assert result == prune(vault, ["ADRs/a.md"], max_bytes=1000)
    with pytest.raises(VaultError, match="filtered"):
        prune(vault, ["ADRs/a.md"], prefix="Entities/")


def test_diff_line_numbers() -> None:
    assert added_lines("@@ -1,0 +2,2 @@\n+first\n+second") == [(2, "first"), (3, "second")]


def test_governance_uses_index_not_worktree(vault: Vault, repo: Path) -> None:
    policy = {"id": "no-requests", "kind": "forbidden_import", "value": "requests", "rationale": "Gateway required"}
    vault.write("ADRs/network.md", {"status": "accepted", "policies": [policy]}, "Boundary")
    (repo / "app.py").write_text("import requests\n")
    subprocess.run(["git", "-C", str(repo), "add", "app.py"], check=True)
    (repo / "app.py").write_text("import json\n")
    staged = check_governance(vault, repo, draft_rfc=True)
    assert not staged.compliant
    assert staged.violations[0].rule == "no-requests"
    assert check_governance(vault, repo, mode="worktree").compliant
    assert len(list(vault.notes("RFCs/"))) == 1


def test_proposed_policies_not_enforced_and_bad_accepted_rules_fail(vault: Vault, repo: Path) -> None:
    vault.write("ADRs/proposed.md", {"status": "proposed", "policies": [{"nonsense": True}]}, "Proposal")
    assert check_governance(vault, repo).compliant
    vault.write("ADRs/accepted.md", {"status": "accepted", "policies": [{"nonsense": True}]}, "Malformed")
    with pytest.raises(ValueError):
        check_governance(vault, repo)


def test_handoff_roundtrip_idempotence_redaction_and_integrity(vault: Vault, repo: Path) -> None:
    state = SessionState(session_id="demo", objective="Preserve work", summary="api_key=secret-value", tasks=[TaskState(id="a", title="Check", status="open")], next_actions=["Review ``` code"])
    saved = serialize_context(vault, repo, state)
    before = vault.read(saved["path"]).body
    assert serialize_context(vault, repo, state) == saved
    assert vault.read(saved["path"]).body == before
    restored = restore_context(vault, saved["path"], saved["session_key"])
    assert restored["snapshot"]["state"]["summary"] == "[REDACTED]"
    assert restored["snapshot"]["state"]["next_actions"] == state.next_actions
    assert "secret-value" not in before
    note = vault.read(saved["path"])
    vault.write(saved["path"], note.metadata, note.body.replace("Preserve work", "Tampered work"), overwrite=True)
    with pytest.raises(VaultError, match="integrity"):
        restore_context(vault, saved["path"])


def test_handoff_preserves_manual_daily_note(vault: Vault, repo: Path) -> None:
    state = SessionState(session_id="daily", objective="Continue", summary="Explicit summary")
    saved = serialize_context(vault, repo, state)
    note = vault.read(saved["path"])
    vault.write(saved["path"], note.metadata, "Personal notes\n" + note.body, overwrite=True)
    serialize_context(vault, repo, state.model_copy(update={"summary": "Next state"}))
    assert vault.read(saved["path"]).body.startswith("Personal notes")
    assert restore_context(vault, saved["path"])["snapshot"]["state"]["summary"] == "Next state"


def test_execution_tree_cycles_rejected(vault: Vault, repo: Path) -> None:
    state = SessionState(session_id="cycle", objective="No cycles", summary="", tasks=[TaskState(id="a", parent_id="a", title="Cycle", status="open")])
    with pytest.raises(VaultError, match="cycle"):
        serialize_context(vault, repo, state)


def test_cli_errors_and_structured_output(vault: Vault, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["entity", "--vault", str(vault.root), "--name", "Denied"]) == 2
    assert "disabled" in capsys.readouterr().err
    assert main(["entity", "--vault", str(vault.root), "--name", "CLI", "--allow-write"]) == 0
    assert json.loads(capsys.readouterr().out)["path"] == f"Entities/{stable_id('CLI')}.md"


def test_real_stdio_mcp_handshake_tools_and_readonly_errors(vault: Vault) -> None:
    async def exercise() -> None:
        parameters = StdioServerParameters(command=sys.executable, args=["-m", "graph_engineering.server", "--vault", str(vault.root), "--profile", "memory"])
        async with stdio_client(parameters) as (reader, writer):
            async with ClientSession(reader, writer) as session:
                await session.initialize()
                tools = await session.list_tools()
                assert {tool.name for tool in tools.tools} == {"search_vault", "create_adr", "query_backlinks", "update_entity_node"}
                result = await session.call_tool("update_entity_node", {"name": "Denied", "facts": [], "related": []})
                assert result.isError
                assert not (vault.root / ".graph-engineering.lock").exists()
                result = await session.call_tool("search_vault", {"query": "no match"})
                assert not result.isError
    asyncio.run(exercise())


@pytest.mark.parametrize("profile,expected", [
    ("memory", {"search_vault", "create_adr", "query_backlinks", "update_entity_node"}),
    ("graph", {"generate_code_graph"}),
    ("retrieval", {"prune_subgraph"}),
    ("governance", {"check_adr_governance"}),
    ("handoff", {"serialize_context", "restore_context"}),
])
def test_mcp_profile_isolation(vault: Vault, repo: Path, profile: str, expected: set[str]) -> None:
    async def exercise() -> None:
        tools = await build_server(Vault(vault.root), str(repo), profile).list_tools()
        assert {tool.name for tool in tools} == expected
        for tool in tools:
            assert tool.inputSchema["type"] == "object"
            assert tool.annotations is not None
            if tool.name in {"search_vault", "query_backlinks", "prune_subgraph", "restore_context"}:
                assert tool.annotations.readOnlyHint is True
            else:
                assert tool.annotations.readOnlyHint is False
    asyncio.run(exercise())


def test_all_capabilities_roundtrip_over_real_mcp(vault: Vault, repo: Path) -> None:
    async def exercise() -> None:
        parameters = StdioServerParameters(command=sys.executable, args=["-m", "graph_engineering.server", "--vault", str(vault.root), "--repo", str(repo), "--profile", "all", "--allow-write"])
        async with stdio_client(parameters) as (reader, writer):
            async with ClientSession(reader, writer) as session:
                await session.initialize()
                assert len((await session.list_tools()).tools) == 9
                async def call(name: str, payload: dict[str, object]) -> str:
                    result = await session.call_tool(name, payload)
                    assert not result.isError, result
                    return "\n".join(getattr(block, "text", "") for block in result.content)
                entity = json.loads(await call("update_entity_node", {"name": "Service", "facts": ["Local service"], "related": []}))["path"]
                adr = ADRInput(title="MCP boundary", context="Protocol roundtrip", decision="Use stdio", consequences="Local process", entities=[entity])
                path = json.loads(await call("create_adr", {"record": adr.model_dump()}))["path"]
                assert path in await call("search_vault", {"query": "MCP boundary"})
                assert path in await call("query_backlinks", {"target": entity})
                assert path in await call("prune_subgraph", {"seeds": [path]})
                assert "symbols" in await call("generate_code_graph", {})
                assert json.loads(await call("check_adr_governance", {}))["compliant"]
                state = SessionState(session_id="mcp-demo", objective="Handoff via protocol", summary="Persist explicit state")
                saved = json.loads(await call("serialize_context", {"state": state.model_dump()}))
                restored = json.loads(await call("restore_context", {"note": saved["path"], "session_key": saved["session_key"]}))
                assert restored["snapshot"]["state"]["objective"] == state.objective
    asyncio.run(exercise())
