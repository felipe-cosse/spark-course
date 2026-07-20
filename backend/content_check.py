from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
EXERCISES = DOCS / "exercises"
SOLUTIONS = DOCS / "solutions" / "reference-solutions.md"

SOURCE_PATTERN = re.compile(r"^Source: \[[^]]+]\(([^)]+\.md)\)\s*$", re.MULTILINE)
EXERCISE_PATTERN = re.compile(r"^## Exercise (\d+)\s*(?::|—)\s*.+$", re.MULTILINE)
SOLUTION_PATTERN = re.compile(r"^## (/docs/.+\.md)#(\d+)\s*$", re.MULTILINE)
UNFINISHED_MARKERS = ("TODO", "For the full exercise, add", "has not been published")


def expected_solution_keys() -> set[str]:
    keys: set[str] = set()
    for path in sorted(EXERCISES.rglob("*.md")):
        if path.name == "README.md":
            continue
        markdown = path.read_text(encoding="utf-8")
        source_match = SOURCE_PATTERN.search(markdown)
        if source_match is None:
            raise ValueError(f"Missing source link in {path.relative_to(ROOT)}")
        source = (path.parent / source_match.group(1)).resolve()
        try:
            source_path = source.relative_to(ROOT)
        except ValueError as exc:
            raise ValueError(f"Source link escapes the repository in {path.relative_to(ROOT)}") from exc
        if not source.exists():
            raise ValueError(f"Missing source page {source_path} referenced by {path.relative_to(ROOT)}")
        if "## Key terms on this page" not in source.read_text(encoding="utf-8"):
            raise ValueError(f"Missing page-level definitions in {source_path}")
        for number in EXERCISE_PATTERN.findall(markdown):
            keys.add(f"/{source_path.as_posix()}#{number}")
    return keys


def published_solutions() -> dict[str, str]:
    markdown = SOLUTIONS.read_text(encoding="utf-8")
    matches = list(SOLUTION_PATTERN.finditer(markdown))
    solutions: dict[str, str] = {}
    for index, match in enumerate(matches):
        key = f"{match.group(1)}#{match.group(2)}"
        if key in solutions:
            raise ValueError(f"Duplicate reference solution: {key}")
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        solutions[key] = markdown[match.end():end].strip()
    return solutions


def check_content() -> list[str]:
    failures: list[str] = []
    try:
        expected = expected_solution_keys()
        published = published_solutions()
    except ValueError as exc:
        return [str(exc)]

    missing = sorted(expected - set(published))
    extra = sorted(set(published) - expected)
    if missing:
        failures.append(f"Missing solutions: {', '.join(missing)}")
    if extra:
        failures.append(f"Solutions without exercises: {', '.join(extra)}")

    for key in sorted(expected & set(published)):
        answer = published[key]
        word_count = len(re.findall(r"\b[\w'-]+\b", answer))
        if word_count < 40:
            failures.append(f"{key}: reference answer is too brief ({word_count} words)")
        marker = next((marker for marker in UNFINISHED_MARKERS if marker in answer), None)
        if marker:
            failures.append(f"{key}: unfinished marker remains ({marker})")
    return failures


def main() -> int:
    failures = check_content()
    if failures:
        for failure in failures:
            print(f"FAIL {failure}")
        return 1
    print(f"PASS {len(expected_solution_keys())} exercises have source-linked, substantive reference solutions and page definitions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
