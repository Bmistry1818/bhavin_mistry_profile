"""Read-only Git collection. Arguments are never interpreted by a shell."""
from __future__ import annotations

import subprocess
import queue
import threading
import time
from pathlib import Path

from .vault import VaultError

MAX_GIT_BYTES = 2_000_000


def git(root: Path, *arguments: str) -> str:
    command = ["git", "--no-pager", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-C", str(root), *arguments]
    completed: queue.Queue[bytes | VaultError] = queue.Queue(maxsize=1)
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    started = time.monotonic()

    def collect() -> None:
        output = bytearray()
        try:
            assert process.stdout is not None
            while chunk := process.stdout.read(65536):
                output.extend(chunk)
                if len(output) > MAX_GIT_BYTES:
                    completed.put(VaultError("Git output exceeds collection budget"))
                    return
            completed.put(bytes(output))
        except OSError:
            completed.put(VaultError("Git output collection failed"))

    worker = threading.Thread(target=collect, daemon=True)
    worker.start()
    try:
        output = completed.get(timeout=15)
        if isinstance(output, VaultError):
            raise output
        code = process.wait(timeout=max(0.1, 15 - (time.monotonic() - started)))
        if code:
            raise VaultError(f"Git {arguments[0]} failed; verify repository and revision")
        return output.decode("utf-8", errors="replace")
    except (queue.Empty, subprocess.TimeoutExpired) as error:
        raise VaultError("Git command timed out") from error
    finally:
        if process.poll() is None:
            process.kill()
        process.wait(timeout=5)
        worker.join(timeout=1)
        if process.stdout is not None:
            process.stdout.close()


def repository(root: str | Path) -> Path:
    path = Path(root).expanduser().resolve(strict=True)
    toplevel = git(path, "rev-parse", "--show-toplevel").strip()
    return Path(toplevel).resolve(strict=True)
