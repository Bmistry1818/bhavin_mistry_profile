"""Bounded vault access, frontmatter, link resolution and locked atomic writes."""
from __future__ import annotations

import hashlib
import os
import re
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import yaml
from filelock import FileLock
from pydantic import BaseModel, ConfigDict, Field

MAX_NOTE_BYTES = 1_048_576
MAX_NOTES = 5_000
EXCLUDED = {".git", ".obsidian", ".aws", ".ssh", "node_modules", ".venv", "__pycache__"}
LINK = re.compile(r"\[\[([^\]\n]+)\]\]")


class VaultError(ValueError):
    """An invalid or unsafe vault operation."""


class Note(BaseModel):
    model_config = ConfigDict(extra="forbid")
    path: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    body: str


def stable_id(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")[:60] or "note"
    return f"{slug}-{hashlib.sha256(label.encode()).hexdigest()[:12]}"


def links(body: str) -> list[str]:
    return sorted({match.split("|", 1)[0].split("#", 1)[0].strip().removesuffix(".md")
                   for match in LINK.findall(body) if match.split("|", 1)[0].split("#", 1)[0].strip()})


def wiki(target: str) -> str:
    if any(char in target for char in "[]|#\n\r") or not target.strip():
        raise VaultError("Invalid wikilink target")
    return f"[[{target.removesuffix('.md')}]]"


def decode_note(relative: str, text: str) -> Note:
    metadata: dict[str, Any] = {}
    body = text
    if text.startswith("---\n"):
        parts = text.split("\n---\n", 1)
        if len(parts) != 2:
            raise VaultError(f"Unclosed frontmatter: {relative}")
        frontmatter = parts[0][4:]
        # YAML aliases can amplify tiny untrusted documents. This tool does not need them.
        try:
            if any(isinstance(event, yaml.events.AliasEvent) for event in yaml.parse(frontmatter)):
                raise VaultError(f"YAML aliases are unsupported: {relative}")
            data = yaml.safe_load(frontmatter) or {}
        except (yaml.YAMLError, RecursionError) as error:
            raise VaultError(f"Invalid or excessively nested frontmatter: {relative}") from error
        if not isinstance(data, dict) or any(not isinstance(key, str) for key in data):
            raise VaultError(f"Frontmatter must be a mapping: {relative}")
        metadata = data
        body = parts[1]
    return Note(path=relative, metadata=metadata, body=body)


def encode_note(metadata: dict[str, Any], body: str) -> str:
    return "---\n" + yaml.safe_dump(metadata, sort_keys=True, allow_unicode=True) + "---\n" + body.rstrip() + "\n"


class Vault:
    def __init__(self, root: str | Path, *, writable: bool = False) -> None:
        self.root = Path(root).expanduser().resolve(strict=True)
        if not self.root.is_dir():
            raise VaultError("Vault must be an existing directory")
        self.writable = writable
        if (self.root / ".graph-engineering.lock").is_symlink():
            raise VaultError("Symlinked lock file is unsupported")
        self.lock = FileLock(str(self.root / ".graph-engineering.lock"), timeout=10)

    def require_write(self) -> None:
        if not self.writable:
            raise VaultError("Writes disabled; explicitly enable allow-write")

    def path(self, relative: str) -> Path:
        candidate = Path(relative)
        if candidate.is_absolute() or ".." in candidate.parts or any(p in EXCLUDED for p in candidate.parts):
            raise VaultError("Path must remain inside the allowed vault")
        if candidate.suffix != ".md" or not candidate.parts:
            raise VaultError("Only Markdown notes are supported")
        path = self.root / candidate
        for parent in [path, *path.parents]:
            if parent == self.root:
                break
            if parent.is_symlink():
                raise VaultError("Symlinked notes and directories are unsupported")
        if not path.resolve().is_relative_to(self.root):
            raise VaultError("Path escapes vault")
        return path

    def notes(self, prefix: str = "") -> Iterator[Note]:
        count = 0
        for directory, directories, files in os.walk(self.root, followlinks=False):
            directories[:] = sorted(d for d in directories if d not in EXCLUDED and not d.startswith(".")
                                    and not (Path(directory) / d).is_symlink())
            for name in sorted(files):
                if not name.endswith(".md"):
                    continue
                path = Path(directory) / name
                if path.is_symlink():
                    continue
                relative = path.relative_to(self.root).as_posix()
                if prefix and not relative.startswith(prefix):
                    continue
                count += 1
                if count > MAX_NOTES:
                    raise VaultError(f"Vault exceeds {MAX_NOTES} note limit; narrow path prefix")
                yield self.read(relative)

    def read(self, relative: str) -> Note:
        path = self.path(relative)
        if path.stat().st_size > MAX_NOTE_BYTES:
            raise VaultError(f"Note exceeds size limit: {relative}")
        return decode_note(relative, path.read_text(encoding="utf-8"))

    def write(self, relative: str, metadata: dict[str, Any], body: str, *, overwrite: bool = False) -> str:
        self.require_write()
        payload = encode_note(metadata, body)
        if len(payload.encode()) > MAX_NOTE_BYTES:
            raise VaultError("Note exceeds size limit")
        with self.lock:
            path = self.path(relative)
            path.parent.mkdir(parents=True, exist_ok=True)
            self.path(relative)
            if path.exists() and not overwrite:
                if path.read_text(encoding="utf-8") == payload:
                    return relative
                raise VaultError("Note exists with different content; update explicitly")
            handle, temporary = tempfile.mkstemp(prefix=".graph-note-", dir=path.parent)
            try:
                with os.fdopen(handle, "w", encoding="utf-8") as stream:
                    stream.write(payload)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, path)
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
        return relative


def resolve_link(target: str, source: str, paths: set[str]) -> str | None:
    target = target.removesuffix(".md")
    for candidate in (target + ".md", (Path(source).parent / (target + ".md")).as_posix()):
        if candidate in paths:
            return candidate
    matches = sorted(path for path in paths if Path(path).stem == target)
    return matches[0] if len(matches) == 1 else None
