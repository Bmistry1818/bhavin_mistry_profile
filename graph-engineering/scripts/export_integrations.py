"""Regenerate native Codex skill copies and dispatcher schemas from canonical sources."""
from __future__ import annotations

import json
from pathlib import Path
from graph_engineering.schemas import PAYLOADS


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for canonical in sorted((root / ".claude/skills").glob("*/SKILL.md")):
        destination = root / ".agents/skills" / canonical.parent.name / "SKILL.md"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(canonical.read_text(encoding="utf-8"), encoding="utf-8")
    schemas = {"format": "application dispatcher function payloads; not a Codex config registry",
               "tools": [{"type": "function", "function": {"name": name, "parameters": model.model_json_schema()}} for name, model in PAYLOADS.items()]}
    folder = root / "schemas"
    folder.mkdir(exist_ok=True)
    (folder / "cli-tools.json").write_text(json.dumps(schemas, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
