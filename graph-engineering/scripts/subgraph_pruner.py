"""Standalone bounded context CLI."""
import sys
from graph_engineering.cli import main

if __name__ == "__main__":
    raise SystemExit(main(["prune", *sys.argv[1:]]))
