#!/usr/bin/env python3
"""Read-only inspection for one active OpenSpec work unit."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from typing import NoReturn

WORKTREE_ROOT = Path("/home/reos156/proyectos/mundo-kawaii-pos/code/worktrees")
WU_ID_RE = re.compile(r"(?<![A-Za-z0-9_-])WU-\d{2}(?![A-Za-z0-9_-])")
WU_TOKEN_CANDIDATE_RE = re.compile(r"[A-Za-z0-9_-]*WU-[A-Za-z0-9_-]*")
WU_HEADING_RE = re.compile(r"^###[ \t]+(WU-\d{2})[ \t]+[—-][ \t]+(.+?)[ \t]*$", re.MULTILINE)
IMPLEMENTATION_CHECKBOX_RE = re.compile(
    r"^\s*-\s*\[([ xX])\].*?<!--\s*sdd-owner:\s*implementation\s*-->\s*$"
)


class InspectionError(Exception):
    """An expected, user-actionable inspection failure."""


def fail(code: str, message: str) -> NoReturn:
    print(
        json.dumps(
            {"error": {"code": code, "message": message}},
            indent=2,
            sort_keys=True,
        ),
        file=sys.stderr,
    )
    raise SystemExit(2)


def run_git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["git", "-C", str(repo), *args],
            check=check,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:
        raise InspectionError("git is not available") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or "unknown Git error"
        raise InspectionError(f"git {' '.join(args)} failed: {detail}") from exc


def resolve_repo(candidate: Path) -> Path:
    result = run_git(candidate, "rev-parse", "--show-toplevel")
    return Path(result.stdout.strip()).resolve()


def active_tasks_file(repo: Path) -> Path:
    changes = repo / "openspec" / "changes"
    matches = sorted(
        path.resolve()
        for path in changes.glob("*/tasks.md")
        if path.parent.name != "archive" and path.is_file()
    )
    if len(matches) != 1:
        relative = [str(path.relative_to(repo)) for path in matches]
        raise InspectionError(
            "expected exactly one active non-archive openspec/changes/*/tasks.md; "
            f"found {len(matches)}: {relative}"
        )
    return matches[0]


def parse_work_unit(text: str, work_unit_id: str) -> tuple[str, str, str]:
    matches = [match for match in WU_HEADING_RE.finditer(text) if match.group(1) == work_unit_id]
    if len(matches) != 1:
        raise InspectionError(
            f"expected exactly one heading for {work_unit_id}; found {len(matches)}"
        )

    match = matches[0]
    next_heading = re.search(r"^#{1,3}(?!#)\s+", text[match.end() :], re.MULTILINE)
    body_end = match.end() + next_heading.start() if next_heading else len(text)
    heading = match.group(0)
    title = match.group(2).strip()
    body = text[match.end() : body_end].strip()
    return heading, title, body


def parse_dependencies(body: str) -> tuple[str, list[str]]:
    match = re.search(
        r"\*\*Dependencies:\*\*\s*(.+?)(?=\s+\*\*(?:Finish|Acceptance|Rollback):\*\*|$)",
        body,
        re.IGNORECASE | re.MULTILINE,
    )
    if not match:
        raise InspectionError("work unit has no parseable **Dependencies:** field")
    text = match.group(1).strip().rstrip(".")
    candidates = WU_TOKEN_CANDIDATE_RE.findall(text)
    malformed = sorted({token for token in candidates if not WU_ID_RE.fullmatch(token)})
    if malformed:
        raise InspectionError(f"malformed dependency work-unit IDs: {malformed}")
    return text, sorted(set(WU_ID_RE.findall(text)))


def count_implementation_tasks(body: str) -> tuple[int, int]:
    states = []
    for line in body.splitlines():
        match = IMPLEMENTATION_CHECKBOX_RE.match(line)
        if match:
            states.append(match.group(1).lower())
    if not states:
        raise InspectionError("work unit has no implementation-owned checkboxes")
    completed = sum(state == "x" for state in states)
    return completed, len(states) - completed


def slugify(work_unit_id: str, title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    words = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    suffix = words[:56].rstrip("-") or "work-unit"
    return f"{work_unit_id.lower()}-{suffix}"


def branch_refs(repo: Path, branch: str) -> tuple[bool, list[str]]:
    local = run_git(repo, "show-ref", "--verify", "--quiet", f"refs/heads/{branch}", check=False)
    remote = run_git(
        repo,
        "for-each-ref",
        "--format=%(refname:short)",
        f"refs/remotes/*/{branch}",
    )
    remote_refs = sorted(line for line in remote.stdout.splitlines() if line)
    return local.returncode == 0, remote_refs


def registered_worktree(repo: Path, target: Path) -> dict[str, object]:
    result = run_git(repo, "worktree", "list", "--porcelain")
    records: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for line in [*result.stdout.splitlines(), ""]:
        if not line:
            if current:
                records.append(current)
                current = {}
            continue
        key, _, value = line.partition(" ")
        current[key] = value

    target_resolved = target.resolve(strict=False)
    for record in records:
        worktree = record.get("worktree")
        if worktree and Path(worktree).resolve(strict=False) == target_resolved:
            branch_ref = record.get("branch", "")
            return {
                "branch": branch_ref.removeprefix("refs/heads/") or None,
                "registered": True,
            }
    return {"branch": None, "registered": False}


def inspect(work_unit_id: str, repo_candidate: Path) -> dict[str, object]:
    if not WU_ID_RE.fullmatch(work_unit_id):
        raise InspectionError("work-unit ID must match WU-XX exactly (for example, WU-00)")

    repo = resolve_repo(repo_candidate)
    tasks_path = active_tasks_file(repo)
    text = tasks_path.read_text(encoding="utf-8")
    heading, title, body = parse_work_unit(text, work_unit_id)
    dependency_text, dependency_ids = parse_dependencies(body)
    canonical_ids = [match.group(1) for match in WU_HEADING_RE.finditer(text)]
    invalid_dependencies = [
        dependency_id
        for dependency_id in dependency_ids
        if canonical_ids.count(dependency_id) != 1
    ]
    if invalid_dependencies:
        raise InspectionError(
            "dependency IDs must each match exactly one canonical WU heading: "
            f"{invalid_dependencies}"
        )
    completed, pending = count_implementation_tasks(body)
    if pending == 0:
        raise InspectionError(
            f"{work_unit_id} is already complete ({completed} implementation checkboxes checked)"
        )

    slug = slugify(work_unit_id, title)
    branch = f"feat/{slug}"
    checkout_path = WORKTREE_ROOT / slug
    local_exists, remote_refs = branch_refs(repo, branch)
    registration = registered_worktree(repo, checkout_path)
    current_branch = run_git(repo, "branch", "--show-current").stdout.strip() or None

    herdr_bin = os.environ.get("HERDR_BIN_PATH", "")
    herdr_env_ok = os.environ.get("HERDR_ENV") == "1"
    herdr_bin_exists = bool(herdr_bin) and Path(herdr_bin).is_file()
    herdr_bin_executable = herdr_bin_exists and os.access(herdr_bin, os.X_OK)

    return {
        "active_change": tasks_path.parent.name,
        "dependencies": {"ids": dependency_ids, "text": dependency_text},
        "inspection": {
            "branch": {
                "exists": local_exists or bool(remote_refs),
                "local_exists": local_exists,
                "remote_refs": remote_refs,
            },
            "current_branch": current_branch,
            "herdr": {
                "available": herdr_env_ok and herdr_bin_executable,
                "bin_executable": herdr_bin_executable,
                "bin_path": herdr_bin or None,
                "env_ok": herdr_env_ok,
            },
            "path": {
                "exists": checkout_path.exists(),
                **registration,
            },
            "repo_root": str(repo),
            "tasks_file": str(tasks_path.relative_to(repo)),
        },
        "schema_version": 1,
        "suggestion": {
            "branch": branch,
            "path": str(checkout_path),
            "slug": slug,
        },
        "work_unit": {
            "body": body,
            "heading": heading,
            "id": work_unit_id,
            "title": title,
        },
        "implementation_tasks": {
            "completed": completed,
            "pending": pending,
            "total": completed + pending,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_unit_id", help="Exact work-unit ID, such as WU-00")
    parser.add_argument("repo", nargs="?", default=".", help="Repository path (default: current directory)")
    args = parser.parse_args()

    try:
        result = inspect(args.work_unit_id, Path(args.repo))
    except (InspectionError, OSError, UnicodeError) as exc:
        fail("inspection_failed", str(exc))
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
