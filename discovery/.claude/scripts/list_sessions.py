#!/usr/bin/env python3
"""
list_sessions.py — List recent Claude Code sessions for this project with date and title.

Usage:
  python3 .claude/scripts/list_sessions.py [--n 5]

Prints a numbered menu of the N most recent sessions (default 5), sorted newest first.
Each line: index · date/time · session ID (truncated) · first meaningful user message.
"""

import re
import json
import os
import glob
import argparse
from datetime import datetime

PROJECT_DIR = os.path.join(
    os.path.expanduser("~"),
    ".claude", "projects",
    "c--Users-tatiana-sosnovskikh-github-stuff-Data-Exploration-skills-repair-journey-mockup"
)


def get_title(path: str) -> str:
    """Extract the first meaningful user message from a session JSONL as a title."""
    IDE_FILE = re.compile(r'<ide_opened_file>[^<]*?([^\\/]+\.(?:md|py|sql|json|txt))', re.I)
    SYS_TAG  = re.compile(r'^\s*<(ide_opened_file|system-reminder|command-name)', re.I)
    CMD_MSG  = re.compile(r'<command-message>(.*?)</command-message>', re.I | re.S)
    TAG_BODY = re.compile(r'<[^>]+>[^<]*')

    fallback = None
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("type") != "user":
                    continue

                content = obj.get("message", {}).get("content", "")
                if isinstance(content, list):
                    parts = [b.get("text", "") for b in content
                             if isinstance(b, dict) and b.get("type") == "text"]
                    content = " ".join(parts)

                # capture first IDE-opened filename as fallback title
                if not fallback:
                    m = IDE_FILE.search(content)
                    if m:
                        fallback = f"[opened] {m.group(1)}"

                # skip messages that are entirely system injections
                if SYS_TAG.match(content.strip()):
                    continue

                # skill invocation: extract command name
                m = CMD_MSG.search(content)
                if m:
                    cmd = m.group(1).strip()
                    if cmd:
                        return f"/{cmd}"

                # plain user text: strip tags and return first meaningful line
                clean = TAG_BODY.sub("", content).strip().lstrip("❯ ").strip()
                for part in clean.splitlines():
                    part = part.strip()
                    if len(part) > 5:
                        return part[:80]

    except Exception:
        pass

    return fallback or "(no title)"


def list_sessions(n: int = 5) -> list[dict]:
    files = sorted(
        glob.glob(os.path.join(PROJECT_DIR, "*.jsonl")),
        key=os.path.getmtime,
        reverse=True
    )[:n]

    sessions = []
    for path in files:
        session_id = os.path.basename(path).replace(".jsonl", "")
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M")
        title = get_title(path)
        sessions.append({
            "index": len(sessions) + 1,
            "path": path,
            "session_id": session_id,
            "datetime": mtime,
            "title": title,
        })

    return sessions


def main():
    parser = argparse.ArgumentParser(description="List recent Claude Code sessions.")
    parser.add_argument("--n", type=int, default=5, help="Number of sessions to show (default 5)")
    args = parser.parse_args()

    sessions = list_sessions(args.n)

    if not sessions:
        print(f"No session files found in:\n  {PROJECT_DIR}")
        return

    print("Recent sessions — pick one:\n")
    for s in sessions:
        print(f"  {s['index']}. {s['datetime']}  {s['session_id'][:8]}…  {s['title']}")
    print(f"\n  [1–{len(sessions)} / paste full path]")


if __name__ == "__main__":
    main()
