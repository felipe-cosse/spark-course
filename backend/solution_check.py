from __future__ import annotations

import re
import sys
from pathlib import Path

from backend.runner import run_submission


ROOT = Path(__file__).resolve().parents[1]
SOLUTIONS_PATH = ROOT / "docs" / "solutions" / "reference-solutions.md"

LAB_SOLUTIONS = {
    "setup_remainders": "/docs/00-getting-started/02-setup.md#2",
    "daily_operations": "/docs/01-foundations/02-sessions-and-first-dataframe.md#2",
    "valid_rejected": "/docs/01-foundations/03-schemas-and-types.md#2",
    "rdd_totals": "/docs/01-foundations/04-rdds-and-shared-variables.md#1",
    "clean_customers": "/docs/02-dataframes-sql/01-transformations.md#2",
    "customer_timeline": "/docs/02-dataframes-sql/02-aggregations-and-windows.md#2",
    "reconcile_orders": "/docs/02-dataframes-sql/03-joins.md#3",
    "parse_events": "/docs/02-dataframes-sql/04-storage-and-semi-structured-data.md#2",
    "quality_rules": "/docs/03-production-engineering/02-data-quality-and-idempotency.md#1",
}


def solution_code(markdown: str, key: str) -> str:
    heading = f"## {key}"
    start = markdown.find(heading)
    if start < 0:
        raise ValueError(f"Missing reference solution section: {key}")
    following = markdown[start + len(heading):]
    next_heading = re.search(r"^## /docs/.+\.md#\d+\s*$", following, re.MULTILINE)
    section = following[:next_heading.start()] if next_heading else following
    block = re.search(r"```python\s*\n([\s\S]*?)```", section)
    if block is None:
        raise ValueError(f"The graded solution has no Python code block: {key}")
    return block.group(1).strip()


def check_solutions(lab_ids: list[str] | None = None) -> list[str]:
    markdown = SOLUTIONS_PATH.read_text(encoding="utf-8")
    failures: list[str] = []
    selected = LAB_SOLUTIONS if not lab_ids else {
        lab_id: LAB_SOLUTIONS[lab_id] for lab_id in lab_ids
    }

    for lab_id, key in selected.items():
        try:
            code = solution_code(markdown, key)
            result, status = run_submission({"code": code, "mode": "check", "lab_id": lab_id})
        except Exception as exc:
            failures.append(f"{lab_id}: {type(exc).__name__}: {exc}")
            print(f"FAIL {lab_id}: could not run the published solution")
            continue

        tests = result.get("tests", [])
        failed_tests = [test for test in tests if not test.get("passed")]
        if status != 200 or not result.get("ok") or not tests or failed_tests:
            details = "\n".join(part for part in [result.get("error"), result.get("stderr")] if part) or "; ".join(
                f"{test.get('name')}: {test.get('message')}" for test in failed_tests
            )
            failures.append(f"{lab_id}: {details or 'no grader results returned'}")
            print(f"FAIL {lab_id}: {details or 'no grader results returned'}")
        else:
            print(f"PASS {lab_id}: {len(tests)} grader checks")

    return failures


def main() -> int:
    lab_ids = sys.argv[1:]
    unknown = sorted(set(lab_ids) - set(LAB_SOLUTIONS))
    if unknown:
        print(f"Unknown lab id(s): {', '.join(unknown)}")
        return 2
    failures = check_solutions(lab_ids)
    checked_count = len(lab_ids) if lab_ids else len(LAB_SOLUTIONS)
    if failures:
        print(f"\n{len(failures)} of {checked_count} published solutions failed.")
        return 1
    print(f"\nAll {checked_count} published graded solutions pass.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
