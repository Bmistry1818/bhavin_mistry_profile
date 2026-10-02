"""Regenerate an exact runtime-version lock from the validated environment."""
from __future__ import annotations
from importlib.metadata import distribution
from pathlib import Path
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name


def main() -> None:
    pending: list[tuple[str, frozenset[str]]] = [(name, frozenset()) for name in ["mcp", "pydantic", "PyYAML", "networkx", "tree-sitter", "tree-sitter-typescript", "filelock"]]
    versions: dict[str, str] = {}
    visited: set[tuple[str, frozenset[str]]] = set()
    while pending:
        raw_name, extras = pending.pop()
        name = canonicalize_name(raw_name)
        if (name, extras) in visited:
            continue
        visited.add((name, extras))
        package = distribution(name)
        versions[name] = package.version
        for value in package.requires or []:
            requirement = Requirement(value)
            if requirement.marker is None or any(requirement.marker.evaluate({"extra": extra}) for extra in extras | {""}):
                pending.append((requirement.name, frozenset(requirement.extras)))
    header = "# Validated runtime versions; regenerated with scripts/lock_runtime.py on Python 3.11.\n# Scan and revalidate updates. Platform wheels are resolved by pip; this is not a hash-verified lock.\n"
    (Path(__file__).resolve().parents[1] / "requirements.lock").write_text(header + "\n".join(f"{name}=={versions[name]}" for name in sorted(versions)) + "\n")


if __name__ == "__main__":
    main()
