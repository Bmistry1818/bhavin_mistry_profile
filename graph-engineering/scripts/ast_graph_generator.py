"""Standalone AST graph CLI. Install this package before use."""
import sys
from graph_engineering.cli import main

if __name__ == "__main__":
    raise SystemExit(main(["graph", *sys.argv[1:]]))
