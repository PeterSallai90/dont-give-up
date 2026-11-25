"""SessionStart hook: load the orchestrator instructions into the main session.

Reads .claude/orchestrator.md and prints the SessionStart JSON that Claude Code adds to the
session context. Subagents do not receive SessionStart output. If the file is missing or
unreadable, a clear warning is injected instead, so the failure is never silent. Stdlib only.
"""

import json
import os
import sys
from pathlib import Path


def main() -> None:
    project = os.environ.get("CLAUDE_PROJECT_DIR")
    root = Path(project) if project else Path(__file__).resolve().parents[2]
    path = root / ".claude" / "orchestrator.md"
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as error:
        text = (
            "WARNING: the orchestrator instructions could not be loaded from "
            f"{path} ({error}). Tell the owner before doing any orchestrator work; "
            "CLAUDE.md alone does not contain the flows, delegation map or lanes."
        )
    payload = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": text,
        }
    }
    sys.stdout.buffer.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
    sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()
