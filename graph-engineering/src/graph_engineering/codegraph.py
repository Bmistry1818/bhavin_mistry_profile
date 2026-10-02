"""Python AST and TypeScript Tree-sitter graph extraction; never executes source."""
from __future__ import annotations

import ast
import os
from pathlib import Path
from typing import Literal

import tree_sitter_typescript
from pydantic import BaseModel, ConfigDict, Field
from tree_sitter import Language, Node, Parser

from .vault import EXCLUDED, Vault, VaultError, stable_id, wiki

MAX_SOURCE_BYTES = 1_048_576
MAX_FILES = 2_000
MAX_SYMBOLS = 4_000


class Symbol(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    source: str
    name: str
    kind: Literal["module", "class", "function"]
    language: Literal["python", "typescript"]
    line: int
    end_line: int
    calls: list[str] = Field(default_factory=list)


class Edge(BaseModel):
    source: str
    target: str
    kind: Literal["contains", "imports", "calls"]


class CodeGraph(BaseModel):
    symbols: list[Symbol]
    edges: list[Edge]
    unresolved: list[str]


def identifier(source: str, name: str) -> str:
    return stable_id(f"{source}::{name}")


def source_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for directory, children, names in os.walk(root, followlinks=False):
        children[:] = sorted(child for child in children if child not in EXCLUDED and not child.startswith(".")
                              and not (Path(directory) / child).is_symlink())
        for name in sorted(names):
            candidate = Path(directory) / name
            if candidate.suffix in {".py", ".ts", ".tsx"} and not candidate.is_symlink():
                if candidate.stat().st_size > MAX_SOURCE_BYTES:
                    raise VaultError(f"Source file too large: {candidate.relative_to(root)}")
                files.append(candidate)
                if len(files) > MAX_FILES:
                    raise VaultError("Codebase exceeds file limit; select a narrower source root")
    return sorted(files)


def python_symbols(relative: str, code: str) -> tuple[list[Symbol], list[Edge], dict[str, str]]:
    tree = ast.parse(code, filename=relative)
    module = Symbol(id=identifier(relative, "module"), source=relative, name="module", kind="module", language="python", line=1, end_line=max(1, len(code.splitlines())))
    symbols = [module]
    edges: list[Edge] = []
    imports: dict[str, str] = {}
    stack: list[Symbol] = [module]

    class Visitor(ast.NodeVisitor):
        def definition(self, node: ast.ClassDef | ast.FunctionDef | ast.AsyncFunctionDef) -> None:
            name = ".".join([symbol.name.rsplit(".", 1)[-1] for symbol in stack[1:]] + [node.name])
            symbol = Symbol(id=identifier(relative, name), source=relative, name=name, kind="class" if isinstance(node, ast.ClassDef) else "function", language="python", line=node.lineno, end_line=node.end_lineno or node.lineno)
            symbols.append(symbol)
            edges.append(Edge(source=stack[-1].id, target=symbol.id, kind="contains"))
            stack.append(symbol)
            self.generic_visit(node)
            stack.pop()

        def visit_ClassDef(self, node: ast.ClassDef) -> None:
            self.definition(node)

        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            self.definition(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
            self.definition(node)

        def visit_Call(self, node: ast.Call) -> None:
            if isinstance(node.func, (ast.Name, ast.Attribute)):
                stack[-1].calls.append(ast.unparse(node.func))
            self.generic_visit(node)

        def visit_Import(self, node: ast.Import) -> None:
            for alias in node.names:
                imports[alias.asname or alias.name.split(".")[0]] = alias.name

        def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
            package = list(Path(relative).parent.parts)
            prefix = ".".join(package[:len(package) - node.level + 1]) if node.level else ""
            module_name = ".".join(part for part in [prefix, node.module or ""] if part)
            for alias in node.names:
                if alias.name != "*":
                    imports[alias.asname or alias.name] = module_name + ":" + alias.name

    Visitor().visit(tree)
    return symbols, edges, imports


def ts_symbols(relative: str, code: str) -> tuple[list[Symbol], list[Edge], dict[str, str]]:
    language = tree_sitter_typescript.language_tsx() if relative.endswith(".tsx") else tree_sitter_typescript.language_typescript()
    tree = Parser(Language(language)).parse(code.encode())
    if tree.root_node.has_error:
        raise VaultError(f"TypeScript syntax error: {relative}; no graph notes were changed")
    module = Symbol(id=identifier(relative, "module"), source=relative, name="module", kind="module", language="typescript", line=1, end_line=max(1, len(code.splitlines())))
    symbols = [module]
    edges: list[Edge] = []
    imports: dict[str, str] = {}

    def value(node: Node | None) -> str:
        return node.text.decode() if node is not None and node.text is not None else ""

    def visit(node: Node, owner: Symbol) -> None:
        current = owner
        name = value(node.child_by_field_name("name"))
        declaration = node.type in {"function_declaration", "class_declaration", "method_definition"}
        if node.type == "variable_declarator":
            assigned = node.child_by_field_name("value")
            declaration = assigned is not None and assigned.type in {"arrow_function", "function_expression"}
        if declaration and name:
            qualified = name if owner.kind == "module" else owner.name + "." + name
            current = Symbol(id=identifier(relative, qualified), source=relative, name=qualified, kind="class" if node.type == "class_declaration" else "function", language="typescript", line=node.start_point.row + 1, end_line=node.end_point.row + 1)
            symbols.append(current)
            edges.append(Edge(source=owner.id, target=current.id, kind="contains"))
        if node.type == "call_expression":
            current.calls.append(value(node.child_by_field_name("function")))
        if node.type == "import_statement":
            imports[value(node.child_by_field_name("source")).strip("\"'")] = "typescript-import"
        for child in node.named_children:
            visit(child, current)

    visit(tree.root_node, module)
    return symbols, edges, imports


def extract_graph(root: str | Path) -> CodeGraph:
    directory = Path(root).expanduser().resolve(strict=True)
    if not directory.is_dir():
        raise VaultError("Codebase root must be a directory")
    symbols: list[Symbol] = []
    edges: list[Edge] = []
    pending_imports: dict[str, dict[str, str]] = {}
    for source_path in source_files(directory):
        relative = source_path.relative_to(directory).as_posix()
        code = source_path.read_text(encoding="utf-8")
        parsed, relationships, imports = python_symbols(relative, code) if source_path.suffix == ".py" else ts_symbols(relative, code)
        symbols.extend(parsed)
        edges.extend(relationships)
        pending_imports[relative] = imports
        if len(symbols) > MAX_SYMBOLS:
            raise VaultError("Symbol limit exceeded; narrow codebase root")
    lookup = {(symbol.source, symbol.name): symbol.id for symbol in symbols}
    modules = {symbol.source: symbol.id for symbol in symbols if symbol.kind == "module"}
    python_modules = {source.removesuffix(".py").replace("/", ".").removesuffix(".__init__"): source for source in modules if source.endswith(".py")}
    aliases: dict[tuple[str, str], str] = {}
    unresolved: set[str] = set()
    for source, imports in sorted(pending_imports.items()):
        for alias, imported in sorted(imports.items()):
            target_source: str | None = None
            target_name = "module"
            if imported == "typescript-import":
                if alias.startswith("."):
                    base = os.path.normpath(str(Path(source).parent / alias)).replace(os.sep, "/")
                    candidates = [base, *[base + ext for ext in (".ts", ".tsx")], base + "/index.ts", base + "/index.tsx"]
                    target_source = next((candidate for candidate in candidates if candidate in modules), None)
            else:
                module_name, _, target_name = imported.partition(":")
                target_name = target_name or "module"
                target_source = python_modules.get(module_name)
            if target_source:
                import_target = lookup.get((target_source, target_name), modules[target_source])
                edges.append(Edge(source=modules[source], target=modules[target_source], kind="imports"))
                aliases[(source, alias)] = import_target
            else:
                unresolved.add(f"{source}: import {alias}")
    for symbol in symbols:
        for call in sorted(set(symbol.calls)):
            scope = symbol.name.rsplit(".", 1)[0] if "." in symbol.name else ""
            possible = [(symbol.source, scope + "." + call), (symbol.source, call)]
            target = next((lookup[key] for key in possible if key in lookup), None)
            target = target or aliases.get((symbol.source, call))
            if target:
                edges.append(Edge(source=symbol.id, target=target, kind="calls"))
            else:
                unresolved.add(f"{symbol.source}:{symbol.line}: call {call}")
    unique = {(edge.source, edge.target, edge.kind): edge for edge in edges}
    return CodeGraph(symbols=sorted(symbols, key=lambda symbol: symbol.id), edges=[unique[key] for key in sorted(unique)], unresolved=sorted(unresolved))


def generate_graph(vault: Vault, root: str | Path) -> CodeGraph:
    vault.require_write()
    graph = extract_graph(root)  # Parse everything before any write; syntax errors fail closed.
    incoming: dict[str, set[str]] = {symbol.id: set() for symbol in graph.symbols}
    outgoing: dict[str, set[str]] = {symbol.id: set() for symbol in graph.symbols}
    for edge in graph.edges:
        outgoing[edge.source].add(edge.target)
        incoming[edge.target].add(edge.source)
    start, end = "<!-- graph-engineering:code -->", "<!-- /graph-engineering:code -->"
    with vault.lock:
        # Preflight all collisions before touching any note in this generation.
        for symbol in graph.symbols:
            relative = f"Code/{symbol.id}.md"
            if vault.path(relative).exists():
                existing = vault.read(relative)
                if existing.metadata.get("managed_by") != "graph-engineering" or start not in existing.body or end not in existing.body:
                    raise VaultError("Generated node collides with unmanaged note")
        if vault.path("Code/graph-index.md").exists():
            index = vault.read("Code/graph-index.md")
            if index.metadata.get("managed_by") != "graph-engineering" or index.metadata.get("type") != "graph-index":
                raise VaultError("Graph index collides with unmanaged note")
        for symbol in graph.symbols:
            relative = f"Code/{symbol.id}.md"
            before, after = f"# {symbol.name}\n\n", ""
            metadata: dict[str, object] = {}
            if vault.path(relative).exists():
                old = vault.read(relative)
                if old.metadata.get("managed_by") != "graph-engineering" or start not in old.body or end not in old.body:
                    raise VaultError("Generated node collides with unmanaged note")
                before, remainder = old.body.split(start, 1)
                _, after = remainder.split(end, 1)
                metadata.update(old.metadata)
            metadata.update({"type": "code", "title": symbol.name, "managed_by": "graph-engineering", "source": symbol.source, "kind": symbol.kind, "language": symbol.language, "line": symbol.line, "end_line": symbol.end_line})
            section = f"{start}\nSource: `{symbol.source}:{symbol.line}`\n\n## Outgoing\n"
            section += "\n".join(f"- {wiki('Code/' + target)}" for target in sorted(outgoing[symbol.id]))
            section += "\n\n## Incoming\n" + "\n".join(f"- {wiki('Code/' + source)}" for source in sorted(incoming[symbol.id])) + f"\n{end}"
            vault.write(relative, metadata, before + section + after, overwrite=True)
        vault.write("Code/graph-index.md", {"type": "graph-index", "managed_by": "graph-engineering", "active_nodes": [f"Code/{symbol.id}.md" for symbol in graph.symbols]},
                    "# Code graph index\n\nOnly active_nodes belong to the current generation. Old notes are retained, never deleted.\n\n" + "\n".join(f"- {wiki('Code/' + symbol.id)}" for symbol in graph.symbols), overwrite=True)
    return graph
