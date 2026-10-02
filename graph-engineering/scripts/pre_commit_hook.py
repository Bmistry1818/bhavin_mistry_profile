"""Opt-in pre-commit / agent-loop check. Never writes an RFC or modifies Git."""
import os
import sys
from graph_engineering.cli import main

if __name__ == "__main__":
    vault = os.environ.get("OBSIDIAN_VAULT_PATH")
    if not vault:
        print("Set OBSIDIAN_VAULT_PATH before enabling this hook.", file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(main(["governance", "--vault", vault, "--repo", ".", "--mode", "staged"]))
