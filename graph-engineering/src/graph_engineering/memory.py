"""Atomic architectural decisions and entity memory, independent of any LLM."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .vault import Vault, VaultError, links, resolve_link, stable_id, wiki


class ADRInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=200)
    context: str = Field(min_length=1, max_length=20_000)
    decision: str = Field(min_length=1, max_length=20_000)
    consequences: str = Field(min_length=1, max_length=20_000)
    status: Literal["proposed", "accepted", "superseded", "rejected"] = "proposed"
    entities: list[str] = Field(default_factory=list, max_length=50)


class SearchHit(BaseModel):
    path: str
    title: str
    score: int
    excerpt: str


def search_vault(vault: Vault, query: str, limit: int = 10, prefix: str = "") -> list[SearchHit]:
    terms = sorted(set(query.casefold().split()))
    if not terms or len(query) > 1_000 or not 1 <= limit <= 50:
        raise VaultError("Provide a query of 1–1000 characters and limit of 1–50")
    results: list[SearchHit] = []
    for note in vault.notes(prefix):
        title = str(note.metadata.get("title", note.path))
        corpus = (title + "\n" + note.body).casefold()
        score = sum(corpus.count(term) + 3 * title.casefold().count(term) for term in terms)
        if score:
            location = min((note.body.casefold().find(term) for term in terms if term in note.body.casefold()), default=0)
            excerpt = note.body[max(0, location - 60):location + 260].replace("\n", " ")
            results.append(SearchHit(path=note.path, title=title, score=score, excerpt=excerpt))
    return sorted(results, key=lambda hit: (-hit.score, hit.path))[:limit]


def create_adr(vault: Vault, adr: ADRInput) -> str:
    relative = f"ADRs/{stable_id(adr.title)}.md"
    body = f"# {adr.title}\n\n## Context\n{adr.context}\n\n## Decision\n{adr.decision}\n\n## Consequences\n{adr.consequences}\n\n## Entities\n"
    body += "\n".join(f"- {wiki(entity)}" for entity in sorted(set(adr.entities)))
    return vault.write(relative, {"type": "adr", "title": adr.title, "status": adr.status, "managed_by": "graph-engineering"}, body)


def query_backlinks(vault: Vault, target: str) -> list[str]:
    notes = list(vault.notes())
    paths = {note.path for note in notes}
    resolved = resolve_link(target, "", paths)
    if resolved is None:
        raise VaultError("Target is missing or ambiguous; use its vault-relative path")
    return sorted(note.path for note in notes if any(resolve_link(link, note.path, paths) == resolved for link in links(note.body)))


def update_entity_node(vault: Vault, name: str, facts: list[str], related: list[str]) -> str:
    vault.require_write()
    if not name.strip() or len(name) > 200 or len(facts) > 100 or any(len(fact) > 2_000 for fact in facts) or len(related) > 50:
        raise VaultError("Entity name/facts/links exceed allowed bounds")
    relative = f"Entities/{stable_id(name)}.md"
    start, end = "<!-- graph-engineering:memory -->", "<!-- /graph-engineering:memory -->"
    with vault.lock:
        if vault.path(relative).exists():
            note = vault.read(relative)
            metadata, body = note.metadata, note.body
            if metadata.get("managed_by") != "graph-engineering" or start not in body or end not in body:
                raise VaultError("Refusing to overwrite an unmanaged entity note")
            before, remainder = body.split(start, 1)
            old, after = remainder.split(end, 1)
            previous = [line[2:] for line in old.splitlines() if line.startswith("- ")]
        else:
            metadata = {"title": name, "type": "entity", "managed_by": "graph-engineering"}
            before, after, previous = f"# {name}\n\n", "", []
        merged = sorted(set(previous + [fact.replace("\n", " ") for fact in facts] + [wiki(link) for link in related]))
        section = start + "\n" + "\n".join(f"- {fact}" for fact in merged) + "\n" + end
        return vault.write(relative, metadata, before + section + after, overwrite=True)
