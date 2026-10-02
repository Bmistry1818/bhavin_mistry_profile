"""Standalone governance CLI; exit 1 for violations, 2 for invalid input."""
import sys
from graph_engineering.cli import main

if __name__ == "__main__":
    raise SystemExit(main(["governance", *sys.argv[1:]]))
