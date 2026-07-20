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
            ("o1", "2026-07-18 09:30:00", "12.50", "USD", "COMPLETE"),
            (" ", "2026-07-18 10:00:00", "8.00", "USD", "OPEN"),
            ("o3", "not-a-time", "8.00", "USD", "OPEN"),
            ("o4", "2026-07-18 11:00:00", "wrong", "USD", "OPEN"),
            ("o5", "2026-07-18 12:00:00", "-1.00", "USD", "OPEN"),
            ("o6", "2026-07-18 13:00:00", "9.00", "CAD", "OPEN"),
            ("o7", "2026-07-18 14:00:00", "9.00", "USD", None),
            ("o8", "2026-07-18 15:00:00", "12345678901.23", "USD", "OPEN"),
            (None, "bad-time", "bad-amount", "GBP", None),
            ("o9", "2026-07-19 11:15:00", "20.25", "EUR", "CANCELLED"),
        ], "order_id string, ordered_at_raw string, amount_raw string, currency string, status string")}
    if lab_id == "rdd_totals":
        return {"purchases": [("c1", 10), ("c2", 7), ("c1", 5), ("c3", 11), ("c2", 3)]}
    if lab_id == "clean_customers":
        return {"customers": spark.createDataFrame([
            (" c1 ", " Alice ", " Alice@Example.COM ", "+1 (415) 555-0100", '{"marketing_opt_in":true,"language":"en"}', [" VIP ", "vip", "News"]),
            ("c2", "Bob", "bob@example.com", "020 7946 0958", '{"marketing_opt_in":false,"language":"en"}', ["standard"]),
            (" ", " ", "not-an-email", "555", "{bad-json}", [" ", None]),
        ], "customer_id string, name string, email string, phone string, preferences_json string, tags array<string>")}
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
            ("e1", '{"event_type":"purchase","user_id":"u1","amount":12.50,"customer":{"id":"c1"},"items":[{"sku":"s1","quantity":2},{"sku":"s2","quantity":1}],"attributes":{"channel":"web"}}'),
            ("e2", '{not-json}'),
            ("e3", '{"event_type":"view","user_id":"u2","amount":null,"customer":{"id":"c2"},"items":[],"attributes":{},"unknown_field":"ignored"}'),
        ], "event_id string, payload string")}
    if lab_id == "quality_rules":
        return {"orders": spark.createDataFrame([
            ("o1", "c1", "10.00", "COMPLETE", datetime(2026, 7, 18, 9)),
            ("o1", "c1", "10.00", "COMPLETE", datetime(2026, 7, 18, 9)),
            (" ", "c2", "5.00", "OPEN", datetime(2026, 7, 18, 10)),
            ("o3", "c3", "bad", "OPEN", datetime(2026, 7, 18, 11)),
            ("o4", "c4", "-1.00", "OPEN", datetime(2026, 7, 18, 12)),
            ("o5", "c5", "3.00", "UNKNOWN", datetime(2026, 7, 18, 13)),
            ("o6", "c6", "4.00", None, datetime(2026, 7, 18, 14)),
            ("o7", "c7", "7.00", "OPEN", datetime(2026, 6, 1, 9)),
            (None, "c8", "wrong", None, datetime(2026, 5, 1, 9)),
            ("o9", "c9", "9.00", "OPEN", datetime(2026, 7, 19, 9)),
        ], "order_id string, customer_id string, amount_raw string, status string, event_at timestamp")}
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
        test("DataFrame contract", lambda: (assert_dataframe(result), require_columns(result, {"remainder", "count", "sum"}))),
        test("Filtered remainder counts", lambda: assert_rows(result, {0: 3, 1: 3, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4}, "remainder", "count")),
        test("Remainder sums", lambda: assert_rows(result, {0: 180, 1: 153, 2: 126, 3: 192, 4: 162, 5: 135, 6: 204, 7: 171, 8: 144, 9: 216}, "remainder", "sum")),
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
        assert abs(float(rows["2026-07-18"].cancellation_rate) - 0.25) < 1e-9, "Cancellation rate for 2026-07-18 must be 0.25."
        assert abs(float(rows["2026-07-19"].cancellation_rate) - 0.5) < 1e-9, "Cancellation rate for 2026-07-19 must be 0.5."
    return [test("Output columns and grain", lambda: (assert_dataframe(result), require_columns(result, required), assert_count(result, 2))), test("Daily metric values", values), test("Decimal money types", lambda: assert_decimal_columns(result, {"revenue", "average_order_value"}))]


def grade_valid(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "validate_orders")
    valid, rejected = fn(namespace["raw_orders"])
    return [
        test("Two valid rows", lambda: (assert_dataframe(valid), require_columns(valid, {"order_id", "ordered_at", "amount", "currency", "status"}), assert_ids(valid, {"o1", "o9"}), assert_count(valid, 2))),
        test("Rejected rows retain all evidence", lambda: (assert_dataframe(rejected), require_columns(rejected, {"order_id", "ordered_at_raw", "amount_raw", "currency", "status", "rejection_reasons"}), assert_count(rejected, 8), assert_array_of_strings(rejected, "rejection_reasons"))),
        test("Multiple failures are preserved", lambda: assert_multiple_reasons(rejected)),
        test("Parsed target types", lambda: assert_types(valid, {"ordered_at": T.TimestampType, "amount": T.DecimalType})),
    ]


def grade_rdd(namespace: dict) -> list[dict]:
    reduced_fn = require_function(namespace, "purchase_totals")
    grouped_fn = require_function(namespace, "purchase_totals_grouped")
    reduced = reduced_fn(namespace["sc"], namespace["purchases"])
    grouped = grouped_fn(namespace["sc"], namespace["purchases"])
    expected = {"c1": 15, "c2": 10, "c3": 11}
    return [
        test("reduceByKey totals", lambda: assert_equal(dict(reduced.collect()), expected, "reduceByKey totals do not match the fixture.")),
        test("groupByKey totals", lambda: assert_equal(dict(grouped.collect()), expected, "groupByKey totals do not match the fixture.")),
    ]


def grade_customers(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "clean_customers")
    result = fn(namespace["customers"])
    def values():
        rows = {row.customer_id: row for row in result.collect()}
        assert rows["c1"].name == "Alice" and rows["c1"].email == "alice@example.com", "Trim names and normalize email."
        assert rows["c1"].phone == "14155550100", "Normalize phone to digits."
        assert rows["c1"].tags == ["vip", "news"], "Normalize and deduplicate tags."
        assert rows["c1"].preferences.marketing_opt_in is True, "Parse the preference JSON struct."
        assert set(rows[""].quality_flags) == {"missing_customer_id", "invalid_email", "invalid_phone", "invalid_preferences"}, "Expose all quality flags for the invalid row."
    return [
        test("Selected output schema and grain", lambda: (require_columns(result, {"customer_id", "name", "email", "phone", "preferences", "tags", "quality_flags"}), assert_count(result, 3))),
        test("Normalized nested values", values),
        test("Structured output types", lambda: (assert_types(result, {"preferences": T.StructType, "tags": T.ArrayType, "quality_flags": T.ArrayType}), assert_array_of_strings(result, "quality_flags"))),
    ]


def grade_timeline(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "customer_timeline")
    result = fn(namespace["orders"])
    required = {"sequence", "previous_ordered_at", "days_since_previous", "running_spend", "lifetime_spend", "lifetime_share"}
    def values():
        rows = result.filter(F.col("customer_id") == "c1").orderBy("ordered_at", "order_id").collect()
        assert [row.sequence for row in rows] == [1, 2, 3], "c1 sequence must be 1, 2, 3 in timestamp order."
        assert [row.running_spend for row in rows] == [Decimal("10.00"), Decimal("15.00"), Decimal("17.50")], "Running spend values are incorrect."
        assert [row.lifetime_spend for row in rows] == [Decimal("17.50")] * 3, "Lifetime spend must use the full customer partition."
        assert rows[0].days_since_previous is None and rows[1].days_since_previous == 0 and rows[2].days_since_previous == 1, "Days since previous order are incorrect."
        assert abs(float(rows[-1].lifetime_share) - 1.0) < 1e-9, "The final order must reach a lifetime share of 1.0."
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
    valid, items, malformed = fn(namespace["events"])
    return [
        test("Two accepted event rows", lambda: (require_columns(valid, {"event_id", "event_type", "user_id", "amount", "customer", "items", "attributes"}), assert_ids(valid, {"e1", "e3"}, "event_id"), assert_count(valid, 2))),
        test("Item grain includes empty arrays", lambda: (require_columns(items, {"event_id", "sku", "quantity"}), assert_count(items, 3), assert_empty_item_row(items))),
        test("Rejected payload retains reasons", lambda: (require_columns(malformed, {"event_id", "payload", "rejection_reasons"}), assert_ids(malformed, {"e2"}, "event_id"), assert_array_of_strings(malformed, "rejection_reasons"))),
        test("Decimal amount type", lambda: assert_types(valid, {"amount": T.DecimalType})),
    ]


def grade_quality(namespace: dict) -> list[dict]:
    fn = require_function(namespace, "evaluate_quality")
    valid, rejected, rule_counts = fn(namespace["orders"])
    expected_rules = {"missing_key": 2, "malformed_amount": 2, "negative_amount": 1, "invalid_status": 3, "stale_data": 2, "duplicate_key": 2}
    valid_rows = valid.collect()
    rejected_rows = rejected.collect()
    actual_rules = {row["rule"]: row["count"] for row in rule_counts.select("rule", "count").collect()}

    def routing() -> None:
        assert len(valid_rows) == 1 and valid_rows[0]["order_id"] == "o9", "Only o9 should pass every quality rule."
        assert len(rejected_rows) == 9, f"Expected 9 rejected rows, found {len(rejected_rows)}."

    def evidence() -> None:
        require_columns(rejected, {"order_id", "amount_raw", "status", "event_at", "quality_failures"})
        assert_array_of_strings(rejected, "quality_failures")
        row = next((row for row in rejected_rows if row["order_id"] is None), None)
        expected = {"missing_key", "malformed_amount", "invalid_status", "stale_data"}
        assert row is not None and set(row["quality_failures"]) == expected, "The multi-failure row must retain all four applicable rules."

    return [
        test("Valid and rejected outputs are exhaustive", routing),
        test("Rejected rows retain all failures", evidence),
        test("Aggregate counts by named rule", lambda: assert_equal(actual_rules, expected_rules, "Rule counts do not match the fixture.")),
        test("Valid amount has a decimal type", lambda: assert_types(valid, {"amount": T.DecimalType})),
    ]


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


def assert_array_of_strings(dataframe: DataFrame, column: str) -> None:
    field = next((field for field in dataframe.schema.fields if field.name == column), None)
    assert field is not None, f"Missing column: {column}."
    assert isinstance(field.dataType, T.ArrayType) and isinstance(field.dataType.elementType, T.StringType), f"{column} must be array<string>."


def assert_multiple_reasons(dataframe: DataFrame) -> None:
    row = dataframe.where(F.col("order_id").isNull()).select("rejection_reasons").first()
    assert row is not None and len(row.rejection_reasons) >= 4, "The multi-failure fixture row must retain every rejection reason."


def assert_empty_item_row(dataframe: DataFrame) -> None:
    row = dataframe.where(F.col("event_id") == "e3").first()
    assert row is not None and row.sku is None and row.quantity is None, "explode_outer must preserve the empty-item event with null item fields."
