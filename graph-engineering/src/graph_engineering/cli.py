"""Typed engine behind the cross-harness CLI and standalone scripts."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from filelock import Timeout
from pydantic import ValidationError

from .codegraph import generate_graph
from .governance import check_governance
from .handoff import SessionState, restore_context, serialize_context
from .memory import ADRInput, create_adr, query_backlinks, search_vault, update_entity_node
from .pruner import prune
from .vault import Vault, VaultError


def read_json(file: str) -> Any:
    path = Path(file)
    if path.stat().st_size > 1_048_576:
        raise VaultError("JSON input exceeds 1 MiB")
    return json.loads(path.read_text(encoding="utf-8"))


def main(arguments: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("search", "adr", "backlinks", "entity", "graph", "prune", "governance", "save", "restore"):
        command = commands.add_parser(name)
        command.add_argument("--vault", required=True)
        command.add_argument("--allow-write", action="store_true")
        if name in ("graph", "governance", "save"):
            command.add_argument("--repo", required=True)
        if name in ("adr", "save"):
            command.add_argument("--input-json", required=True)
        if name == "search":
            command.add_argument("--query", required=True)
            command.add_argument("--limit", type=int, default=10)
            command.add_argument("--prefix", default="")
        if name == "backlinks":
            command.add_argument("--target", required=True)
        if name == "entity":
            command.add_argument("--name", required=True)
            command.add_argument("--fact", action="append", default=[])
            command.add_argument("--related", action="append", default=[])
        if name == "prune":
            command.add_argument("--seed", action="append", required=True)
            command.add_argument("--prefix", default="")
            command.add_argument("--max-bytes", type=int, default=12_000)
            command.add_argument("--max-nodes", type=int, default=30)
            command.add_argument("--markdown", action="store_true")
        if name == "governance":
            command.add_argument("--mode", choices=("staged", "worktree", "base"), default="staged")
            command.add_argument("--base", default="HEAD")
            command.add_argument("--draft-rfc", action="store_true")
        if name == "restore":
            command.add_argument("--note", required=True)
            command.add_argument("--session-key")
    args = parser.parse_args(arguments)
    try:
        vault = Vault(args.vault, writable=args.allow_write)
        output: Any
        code = 0
        match args.command:
            case "search":
                output = [hit.model_dump() for hit in search_vault(vault, args.query, args.limit, args.prefix)]
            case "adr":
                output = {"path": create_adr(vault, ADRInput.model_validate(read_json(args.input_json)))}
            case "backlinks":
                output = query_backlinks(vault, args.target)
            case "entity":
                output = {"path": update_entity_node(vault, args.name, args.fact, args.related)}
            case "graph":
                output = generate_graph(vault, args.repo).model_dump()
            case "prune":
                context = prune(vault, args.seed, prefix=args.prefix, max_bytes=args.max_bytes, max_nodes=args.max_nodes)
                if args.markdown:
                    print(context.markdown)
                    return 0
                output = context.model_dump()
            case "governance":
                report = check_governance(vault, args.repo, mode=args.mode, base=args.base, draft_rfc=args.draft_rfc)
                output, code = report.model_dump(), 0 if report.compliant else 1
            case "save":
                output = serialize_context(vault, args.repo, SessionState.model_validate(read_json(args.input_json)))
            case "restore":
                output = restore_context(vault, args.note, args.session_key)
            case _:
                raise VaultError("Unsupported command")
        print(json.dumps(output, indent=2, ensure_ascii=False))
        return code
    except (OSError, ValueError, SyntaxError, ValidationError, Timeout, RecursionError) as error:
        print(json.dumps({"error": str(error), "type": type(error).__name__}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
