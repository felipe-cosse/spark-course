from __future__ import annotations

import ast
import contextlib
import io
import json
import sys
import time
import traceback
from datetime import date, datetime
from decimal import Decimal

from pyspark.sql import DataFrame, SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql import types as T

from backend.labs import build_fixtures, grade


ALLOWED_IMPORT_ROOTS = {
    "collections", "datetime", "decimal", "functools", "itertools", "json",
    "math", "operator", "pyspark", "re", "statistics", "typing",
}
BLOCKED_NAMES = {"breakpoint", "compile", "eval", "exec", "exit", "help", "input", "open", "quit", "__import__"}
BLOCKED_ATTRIBUTES = {
    "chmod", "connect", "fork", "kill", "open", "popen", "remove", "rename",
    "replace", "rmdir", "socket", "spawn", "system", "unlink", "write_text",
}


class SafetyVisitor(ast.NodeVisitor):
    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            if alias.name.split(".")[0] not in ALLOWED_IMPORT_ROOTS:
                raise ValueError(f"Import '{alias.name}' is not available in the course runner.")

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        root = (node.module or "").split(".")[0]
        if root not in ALLOWED_IMPORT_ROOTS:
            raise ValueError(f"Import from '{node.module}' is not available in the course runner.")

    def visit_Name(self, node: ast.Name) -> None:
        if node.id in BLOCKED_NAMES or node.id.startswith("__"):
            raise ValueError(f"'{node.id}' is not available in the course runner.")

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr in BLOCKED_ATTRIBUTES or node.attr.startswith("__"):
            raise ValueError(f"Attribute '{node.attr}' is not available in the course runner.")
        self.generic_visit(node)


def validate(code: str) -> object:
    tree = ast.parse(code, mode="exec")
    SafetyVisitor().visit(tree)
    return compile(tree, "<spark-path-exercise>", "exec")


def explain(dataframe: DataFrame) -> str:
    return dataframe._sc._jvm.PythonSQLUtils.explainString(  # type: ignore[attr-defined]
        dataframe._jdf.queryExecution(), "formatted"  # type: ignore[attr-defined]
    )


def main() -> None:
    started = time.perf_counter()
    payload = json.load(sys.stdin)
    output = io.StringIO()
    errors = io.StringIO()
    spark = None
    response = {
        "ok": False,
        "stdout": "",
        "stderr": "",
        "plan": "",
        "tests": [],
        "duration_ms": 0,
    }

    try:
        compiled = validate(payload["code"])
        spark = (
            SparkSession.builder
            .master("local[2]")
            .appName("spark-path-exercise")
            .config("spark.ui.enabled", "false")
            .config("spark.sql.session.timeZone", "UTC")
            .config("spark.sql.shuffle.partitions", "4")
            .config("spark.driver.memory", "1g")
            .getOrCreate()
        )
        spark.sparkContext.setLogLevel("ERROR")
        namespace = {
            "spark": spark,
            "sc": spark.sparkContext,
            "F": F,
            "T": T,
            "Window": Window,
            "Decimal": Decimal,
            "date": date,
            "datetime": datetime,
        }
        namespace.update(build_fixtures(spark, payload.get("lab_id")))
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            exec(compiled, namespace, namespace)
            result = namespace.get("result")
            plan = ""
            if isinstance(result, DataFrame):
                print("\nResult preview (up to 20 rows):")
                result.show(20, truncate=False)
                plan = explain(result)
            tests = grade(payload.get("lab_id"), namespace) if payload["mode"] == "check" else []

        response.update(
            ok=True,
            stdout=output.getvalue()[-12_000:],
            stderr=errors.getvalue()[-4_000:],
            plan=plan[-18_000:],
            tests=tests,
        )
    except Exception as exc:  # the response deliberately excludes server paths
        response.update(
            error=f"{type(exc).__name__}: {exc}",
            stdout=output.getvalue()[-12_000:],
            stderr=(errors.getvalue() + "\n" + "".join(traceback.format_exception_only(type(exc), exc)))[-4_000:],
        )
    finally:
        if spark is not None:
            spark.stop()
        response["duration_ms"] = round((time.perf_counter() - started) * 1000)
        sys.stdout.write(json.dumps(response))


if __name__ == "__main__":
    main()
