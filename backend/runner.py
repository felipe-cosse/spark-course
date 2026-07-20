from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1]
TIMEOUT_SECONDS = 35


def run_submission(payload: dict) -> tuple[dict, int]:
    environment = {
        **os.environ,
        "PYTHONUNBUFFERED": "1",
        "SPARK_LOCAL_IP": "127.0.0.1",
        "SPARK_LOCAL_DIRS": os.environ.get("SPARK_LOCAL_DIRS", "/tmp/spark-path"),
    }
    try:
        completed = subprocess.run(
            [sys.executable, "-m", "backend.worker"],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            timeout=TIMEOUT_SECONDS,
            env=environment,
            cwd=APP_ROOT,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "stdout": "",
            "stderr": "",
            "plan": "",
            "tests": [],
            "duration_ms": TIMEOUT_SECONDS * 1000,
            "error": f"Execution exceeded the {TIMEOUT_SECONDS}-second limit.",
        }, 408

    if completed.returncode != 0:
        return {
            "ok": False,
            "stdout": "",
            "stderr": completed.stderr[-4_000:],
            "plan": "",
            "tests": [],
            "duration_ms": 0,
            "error": "The isolated Spark worker stopped unexpectedly.",
        }, 500

    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return {
            "ok": False,
            "stdout": "",
            "stderr": completed.stderr[-4_000:],
            "plan": "",
            "tests": [],
            "duration_ms": 0,
            "error": "The runner returned an invalid response.",
        }, 500
    return result, 200
