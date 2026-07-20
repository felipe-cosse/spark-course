from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Callable

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql import types as T


def build_fixtures(spark: SparkSession, lab_id: str | None) -> dict:
    if lab_id == "daily_operations":
        return {"orders": spark.createDataFrame([
            ("o1", "c1", datetime(2026, 7, 18, 9), "COMPLETE", Decimal("42.50")),
            ("o2", "c2", datetime(2026, 7, 18, 10), "CANCELLED", Decimal("18.00")),
            ("o3", "c3", datetime(2026, 7, 18, 11), "COMPLETE", None),
            ("o4", "c1", datetime(2026, 7, 18, 12), "COMPLETE", Decimal("7.50")),
            ("o5", "c2", datetime(2026, 7, 19, 9), "COMPLETE", Decimal("20.00")),
            ("o6", "c2", datetime(2026, 7, 19, 10), "CANCELLED", Decimal("10.00")),
        ], "order_id string, customer_id string, ordered_at timestamp, status string, amount decimal(12,2)")}
    if lab_id == "valid_rejected":
        return {"raw_orders": spark.createDataFrame([
            ("o1", "2026-07-18 09:30:00", "12.50"),
            ("o2", "not-a-time", "8.00"),
            ("o3", "2026-07-19 10:00:00", "wrong"),
            ("o4", "2026-07-19 11:15:00", "20.25"),
        ], "order_id string, ordered_at_raw string, amount_raw string")}
    if lab_id == "rdd_totals":
        return {"purchases": [("c1", 10), ("c2", 7), ("c1", 5), ("c3", 11), ("c2", 3)]}
    if lab_id == "clean_customers":
        return {"customers": spark.createDataFrame([
            ("c1", " Alice@Example.COM ", " us ", "yes"),
            ("c2", "BOB@example.com", "gb", "FALSE"),
            ("c3", None, " br ", "1"),
        ], "customer_id string, email string, country string, marketing_opt_in string")}
    if lab_id == "customer_timeline":
        return {"orders": spark.createDataFrame([
            ("o2", "c1", datetime(2026, 7, 18, 11), Decimal("5.00")),
            ("o1", "c1", datetime(2026, 7, 18, 9), Decimal("10.00")),
            ("o3", "c2", datetime(2026, 7, 19, 8), Decimal("7.50")),
            ("o4", "c1", datetime(2026, 7, 19, 12), Decimal("2.50")),
        ], "order_id string, customer_id string, ordered_at timestamp, amount decimal(12,2)")}
    if lab_id == "reconcile_orders":
        return {
            "source_orders": spark.createDataFrame([
                ("o1", "COMPLETE", Decimal("10.00")), ("o2", "OPEN", Decimal("5.00")), ("o3", "OPEN", Decimal("7.00")),
            ], "order_id string, status string, amount decimal(12,2)"),
            "target_orders": spark.createDataFrame([
                ("o1", "COMPLETE", Decimal("10.00")), ("o2", "COMPLETE", Decimal("6.00")), ("o4", "OPEN", Decimal("2.00")),
            ], "order_id string, status string, amount decimal(12,2)"),
        }
    if lab_id == "parse_events":
        return {"events": spark.createDataFrame([
            ("e1", '{"event_type":"purchase","user_id":"u1","amount":12.50}'),
            ("e2", '{not-json}'),
            ("e3", '{"event_type":"view","user_id":"u2","amount":null}'),
        ], "event_id string, payload string")}
    if lab_id == "quality_rules":
        return {"orders": spark.createDataFrame([
            ("o1", "c1", Decimal("10.00"), "COMPLETE"),
            ("o1", "c1", Decimal("10.00"), "COMPLETE"),
            ("o2", None, Decimal("5.00"), "OPEN"),
            ("o3", "c3", Decimal("-1.00"), "UNKNOWN"),
        ], "order_id string, customer_id string, amount decimal(12,2), status string")}
    return {}


def test(name: str, check: Callable[[], None]) -> dict:
    try:
        check()
        return {"name": name, "passed": True, "message": "Passed"}
    except AssertionError as exc:
        return {"name": name, "passed": False, "message": str(exc) or "The result did not match the expected contract."}
    except Exception as exc:
        return {"name": name, "passed": False, "message": f"{type(exc).__name__}: {exc}"}


def require_function(namespace: dict, name: str):
    function = namespace.get(name)
    assert callable(function), f"Define a function named {name}."
    return function


def require_columns(dataframe: DataFrame, names: set[str]) -> None:
    missing = names - set(dataframe.columns)
    assert not missing, f"Missing columns: {', '.join(sorted(missing))}."


def grade_setup(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "remainder_counts")
    result = fn(namespace["spark"])
    return [
        test("DataFrame contract", lambda: (assert_dataframe(result), require_columns(result, {"remainder", "count"}))),
        test("Ten balanced groups", lambda: assert_rows(result, {i: 10 for i in range(10)}, "remainder", "count")),
    ]


def grade_daily(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "daily_metrics")
    result = fn(namespace["orders"])
    required = {"order_date", "completed_order_count", "completed_customer_count", "revenue", "average_order_value", "cancelled_order_count", "cancellation_rate"}
    expected = {"2026-07-18": (3, 2, Decimal("50.00"), Decimal("25.00"), 1), "2026-07-19": (1, 1, Decimal("20.00"), Decimal("20.00"), 1)}
    def values():
        require_columns(result, required)
        rows = {str(row.order_date): row for row in result.collect()}
        assert set(rows) == set(expected), "Expected exactly one row for each of the two fixture dates."
        for day, wanted in expected.items():
            row = rows[day]
            actual = (row.completed_order_count, row.completed_customer_count, row.revenue, row.average_order_value, row.cancelled_order_count)
            assert actual == wanted, f"Metrics for {day} were {actual}, expected {wanted}."
    return [test("Output columns and grain", lambda: (assert_dataframe(result), require_columns(result, required), assert_count(result, 2))), test("Daily metric values", values), test("Decimal money types", lambda: assert_decimal_columns(result, {"revenue", "average_order_value"}))]


def grade_valid(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "validate_orders")
    valid, rejected = fn(namespace["raw_orders"])
    return [
        test("Two valid rows", lambda: (assert_dataframe(valid), require_columns(valid, {"order_id", "ordered_at", "amount"}), assert_count(valid, 2))),
        test("Two rejected rows with evidence", lambda: (assert_dataframe(rejected), require_columns(rejected, {"order_id", "ordered_at_raw", "amount_raw", "rejection_reason"}), assert_count(rejected, 2))),
        test("Parsed target types", lambda: assert_types(valid, {"ordered_at": T.TimestampType, "amount": T.DecimalType})),
    ]


def grade_rdd(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "purchase_totals")
    result = fn(namespace["sc"], namespace["purchases"])
    return [test("Customer totals", lambda: assert_equal(dict(result.collect()), {"c1": 15, "c2": 10, "c3": 11}, "RDD totals do not match the fixture."))]


def grade_customers(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "clean_customers")
    result = fn(namespace["customers"])
    def values():
        rows = {row.customer_id: row for row in result.collect()}
        assert rows["c1"].email == "alice@example.com" and rows["c1"].country == "US", "Trim/lower email and trim/upper country."
        assert rows["c1"].marketing_opt_in is True and rows["c2"].marketing_opt_in is False and rows["c3"].marketing_opt_in is True, "Normalize yes/1 to true and FALSE to false."
    return [test("Input grain preserved", lambda: assert_count(result, 3)), test("Normalized field values", values), test("Boolean target type", lambda: assert_types(result, {"marketing_opt_in": T.BooleanType}))]


def grade_timeline(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "customer_timeline")
    result = fn(namespace["orders"])
    required = {"sequence", "previous_ordered_at", "running_spend"}
    def values():
        rows = result.filter(F.col("customer_id") == "c1").orderBy("ordered_at", "order_id").collect()
        assert [row.sequence for row in rows] == [1, 2, 3], "c1 sequence must be 1, 2, 3 in timestamp order."
        assert [row.running_spend for row in rows] == [Decimal("10.00"), Decimal("15.00"), Decimal("17.50")], "Running spend values are incorrect."
        assert rows[0].previous_ordered_at is None and rows[1].previous_ordered_at == rows[0].ordered_at, "Previous timestamp must use lag within each customer."
    return [test("Window columns", lambda: require_columns(result, required)), test("Customer timeline values", values), test("Detail grain preserved", lambda: assert_count(result, 4))]


def grade_reconcile(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "reconcile_orders")
    source_only, target_only, changed = fn(namespace["source_orders"], namespace["target_orders"])
    return [
        test("Source-only order", lambda: assert_ids(source_only, {"o3"})),
        test("Target-only order", lambda: assert_ids(target_only, {"o4"})),
        test("Changed order with evidence", lambda: (assert_ids(changed, {"o2"}), assert_changed_evidence(changed))),
    ]


def grade_events(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "parse_events")
    valid, malformed = fn(namespace["events"])
    return [
        test("Two valid events", lambda: (require_columns(valid, {"event_id", "event_type", "user_id", "amount"}), assert_count(valid, 2))),
        test("Malformed payload retained", lambda: (require_columns(malformed, {"event_id", "payload"}), assert_ids(malformed, {"e2"}, "event_id"))),
        test("Decimal amount type", lambda: assert_types(valid, {"amount": T.DecimalType})),
    ]


def grade_quality(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "evaluate_quality")
    result = fn(namespace["orders"])
    required = {"total_count", "missing_customer_count", "invalid_amount_count", "invalid_status_count", "duplicate_order_count", "valid_rate"}
    def values():
        row = result.first()
        assert row.total_count == 4, "total_count must be 4."
        assert row.missing_customer_count == 1 and row.invalid_amount_count == 1 and row.invalid_status_count == 1, "Required-field, amount, or status counts are incorrect."
        assert row.duplicate_order_count == 1, "Count one extra occurrence of the duplicated order_id."
        assert 0 <= float(row.valid_rate) <= 1, "valid_rate must be a ratio between 0 and 1."
    return [test("One-row metric contract", lambda: (require_columns(result, required), assert_count(result, 1))), test("Quality metric values", values)]


GRADERS = {
    "setup_remainders": grade_setup,
    "daily_operations": grade_daily,
    "valid_rejected": grade_valid,
    "rdd_totals": grade_rdd,
    "clean_customers": grade_customers,
    "customer_timeline": grade_timeline,
    "reconcile_orders": grade_reconcile,
    "parse_events": grade_events,
    "quality_rules": grade_quality,
}


def grade(lab_id: str | None, namespace: dict) -> list[dict]:
    grader = GRADERS.get(lab_id or "")
    if grader is None:
        return [{"name": "Known exercise", "passed": False, "message": "This exercise does not have an automatic grader."}]
    try:
        return grader(namespace)
    except AssertionError as exc:
        return [{"name": "Solution contract", "passed": False, "message": str(exc)}]
    except Exception as exc:
        return [{"name": "Solution execution", "passed": False, "message": f"{type(exc).__name__}: {exc}"}]


def assert_dataframe(value) -> None:
    assert isinstance(value, DataFrame), "Return a Spark DataFrame."


def assert_count(dataframe: DataFrame, expected: int) -> None:
    actual = dataframe.count()
    assert actual == expected, f"Expected {expected} rows, found {actual}."


def assert_equal(actual, expected, message: str) -> None:
    assert actual == expected, f"{message} Found {actual}."


def assert_rows(dataframe: DataFrame, expected: dict, key: str, value: str) -> None:
    require_columns(dataframe, {key, value})
    actual = {row[key]: row[value] for row in dataframe.select(key, value).collect()}
    assert actual == expected, f"Expected {expected}, found {actual}."


def assert_decimal_columns(dataframe: DataFrame, names: set[str]) -> None:
    fields = {field.name: field.dataType for field in dataframe.schema.fields}
    invalid = [name for name in names if not isinstance(fields.get(name), T.DecimalType)]
    assert not invalid, f"Expected DecimalType for: {', '.join(invalid)}."


def assert_types(dataframe: DataFrame, expected: dict[str, type]) -> None:
    fields = {field.name: field.dataType for field in dataframe.schema.fields}
    invalid = [name for name, data_type in expected.items() if not isinstance(fields.get(name), data_type)]
    assert not invalid, f"Unexpected data type for: {', '.join(invalid)}."


def assert_ids(dataframe: DataFrame, expected: set[str], column: str = "order_id") -> None:
    require_columns(dataframe, {column})
    actual = {row[column] for row in dataframe.select(column).distinct().collect()}
    assert actual == expected, f"Expected {sorted(expected)}, found {sorted(actual)}."


def assert_changed_evidence(dataframe: DataFrame) -> None:
    columns = set(dataframe.columns)
    source_evidence = any("source" in name.lower() or name.lower().endswith("_left") for name in columns)
    target_evidence = any("target" in name.lower() or name.lower().endswith("_right") for name in columns)
    assert source_evidence and target_evidence, "Changed rows must retain clearly named source and target values."
