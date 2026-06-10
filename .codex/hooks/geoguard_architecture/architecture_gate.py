from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True

HOOKFLOW_DIR = Path(__file__).resolve().parents[1] / "hookflow"
sys.path.insert(0, str(HOOKFLOW_DIR))

from hooklib import continue_turn, git_root, run_git  # noqa: E402


RELEVANT_PREFIXES = (
    "src/",
    "tests/",
    "docs/refactor-architecture-checklist.md",
    "docs/ui-design-system.md",
    "docs/handover.md",
    "docs/AI_HANDOFF.md",
    "docs/experience-notes.md",
    ".codex/hooks.json",
    ".codex/project-ops-workflow.json",
    "package.json",
)


def has_relevant_changes(root: Path) -> bool:
    status = run_git(["status", "--short"], root)
    for line in status.splitlines():
        path_text = line[3:].replace("\\", "/")
        if path_text.startswith(RELEVANT_PREFIXES):
            return True
    return False


def main() -> None:
    root = git_root()
    if not has_relevant_changes(root):
        return

    command = ["npm", "run", "check:architecture", "--silent"]
    if sys.platform.startswith("win"):
        command = ["cmd.exe", "/d", "/s", "/c", "npm run check:architecture --silent"]

    result = subprocess.run(
        command,
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
    )
    if result.returncode == 0:
        return

    output = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
    if len(output) > 1800:
        output = f"{output[:1800]}\n..."
    continue_turn(
        "GeoGuard architecture self-check failed. Fix the boundary violation or update the architecture checklist intentionally, then run npm run check:architecture again.\n\n"
        + output
    )


if __name__ == "__main__":
    main()
