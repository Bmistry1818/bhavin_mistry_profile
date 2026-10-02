"""Print a GUI-safe MCP config with explicit absolute paths; never edits host settings."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", required=True)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--allow-write", action="store_true")
    args = parser.parse_args()
    env = {"OBSIDIAN_VAULT_PATH": str(Path(args.vault).expanduser().resolve(strict=True)),
           "GRAPH_REPO_ROOT": str(Path(args.repo).expanduser().resolve(strict=True)),
           "GRAPH_ALLOW_WRITE": "1" if args.allow_write else "0"}
    profiles = {"graph_memory": "memory", "code_graph": "graph", "graph_retrieval": "retrieval", "adr_governance": "governance", "sprint_handoff": "handoff"}
    servers = {name: {"command": sys.executable, "args": ["-m", "graph_engineering.server", "--profile", profile], "env": env} for name, profile in profiles.items()}
    print(json.dumps({"mcpServers": servers}, indent=2))


if __name__ == "__main__":
    main()
