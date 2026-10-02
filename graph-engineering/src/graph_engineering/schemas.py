"""Dispatcher payload models. MCP itself advertises its own native schemas."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from .memory import ADRInput
from .handoff import SessionState


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    vault: str = Field(min_length=1)


class SearchPayload(Payload):
    query: str = Field(min_length=1, max_length=1000)
    limit: int = Field(default=10, ge=1, le=50)
    prefix: str = ""


class ADRPayload(Payload):
    record: ADRInput
    allow_write: bool = False


class BacklinkPayload(Payload):
    target: str = Field(min_length=1)


class EntityPayload(Payload):
    name: str = Field(min_length=1, max_length=200)
    facts: list[str] = Field(default_factory=list, max_length=100)
    related: list[str] = Field(default_factory=list, max_length=50)
    allow_write: bool = False


class GraphPayload(Payload):
    repo: str = Field(min_length=1)
    allow_write: bool = False


class PrunePayload(Payload):
    seeds: list[str] = Field(min_length=1, max_length=20)
    prefix: str = ""
    max_bytes: int = Field(default=12000, ge=512, le=100000)
    max_nodes: int = Field(default=30, ge=1, le=100)


class GovernancePayload(GraphPayload):
    mode: Literal["staged", "worktree", "base"] = "staged"
    base: str = "HEAD"
    draft_rfc: bool = False


class HandoffPayload(GraphPayload):
    state: SessionState


class RestorePayload(Payload):
    note: str
    session_key: str | None = None


PAYLOADS: dict[str, type[BaseModel]] = {"search_vault": SearchPayload, "create_adr": ADRPayload, "query_backlinks": BacklinkPayload,
    "update_entity_node": EntityPayload, "generate_code_graph": GraphPayload,
    "prune_subgraph": PrunePayload, "check_adr_governance": GovernancePayload, "serialize_context": HandoffPayload, "restore_context": RestorePayload}
