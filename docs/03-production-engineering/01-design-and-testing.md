# Production Design and Testing

## Key terms on this page

| Term | Definition |
|---|---|
| I/O | Input/output work that reads from or writes to an external system. |
| Orchestration | Coordination of configuration, reads, transformations, checks, writes, retries, and publication. |
| Pure transformation | DataFrame logic with no hidden I/O, action, or mutable global dependency. |
| Unit test | A fast test of one small behavior, normally using in-memory input and no external service. |
| Integration test | A test that crosses a real boundary such as a file format, catalog, connector, or table provider. |
| Fixture | Controlled test data or setup reused by one or more tests. |
| Assertion | A statement that fails the test when an observed value or structure differs from expectation. |
| Schema assertion | A comparison of column names, types, ordering, and related schema metadata. |
| Test isolation | Preventing one test's session state, files, views, or configuration from affecting another. |
| Invariant | A property that must hold for all relevant inputs or stages, such as conservation of accepted/rejected rows. |

## Separate I/O, logic, and orchestration

A testable job has three layers:

```text
entry point -> read -> pure DataFrame transformations -> quality checks -> write -> metrics
```

```python
from pyspark.sql import DataFrame
import pyspark.sql.functions as F

def completed_order_metrics(orders: DataFrame) -> DataFrame:
    return (
        orders
        .filter(F.col("status") == "COMPLETE")
        .groupBy("order_date")
        .agg(
            F.count("order_id").alias("order_count"),
            F.sum("amount").alias("revenue"),
        )
    )

def run(spark, source_path: str, target_path: str) -> None:
    source = spark.read.parquet(source_path)
    result = completed_order_metrics(source)
    result.write.mode("overwrite").parquet(target_path)
```

`completed_order_metrics` knows only DataFrames and business logic: it filters, groups, and returns a plan. `run` owns environment concerns: paths, reading, calling the logic, and writing. That separation lets a unit test exercise the calculation without creating files, while an integration test can focus on whether Parquet and the target publish protocol behave correctly.

The shown `overwrite` is intentionally incomplete as a production write strategy. It demonstrates why orchestration is not merely boilerplate: the entry point must constrain the overwrite scope, validate the result, and choose a storage-specific atomic publication method.

The example isolates logic, but its write is not yet a production-safe rerun strategy. That is an orchestration concern covered in the next lesson.

## Pytest fixture

```python
import pytest
from pyspark.sql import SparkSession

@pytest.fixture(scope="session")
def spark():
    session = (
        SparkSession.builder
        .master("local[2]")
        .appName("course-tests")
        .config("spark.sql.shuffle.partitions", "2")
        .config("spark.ui.enabled", "false")
        .getOrCreate()
    )
    yield session
    session.stop()
```

The fixture starts one small local session for the test process. `yield` hands it to tests and guarantees the cleanup code runs afterward. Two local threads allow Spark to exercise partitioned work without consuming the whole machine. Session scope saves startup time, but shared configuration and temporary views must be reset if a test changes them.

Keep test parallelism small and deterministic. One shared session is faster, but tests must not leak temporary views, configuration, cached data, or tables into one another.

## DataFrame and schema assertions

Spark provides test utilities:

```python
from decimal import Decimal
from datetime import date
from pyspark.testing.utils import assertDataFrameEqual, assertSchemaEqual

def test_completed_order_metrics(spark):
    source = spark.createDataFrame(
        [
            (date(2026, 7, 20), "o1", "COMPLETE", Decimal("10.00")),
            (date(2026, 7, 20), "o2", "CANCELLED", Decimal("99.00")),
        ],
        "order_date date, order_id string, status string, amount decimal(18,2)",
    )
    expected = spark.createDataFrame(
        [(date(2026, 7, 20), 1, Decimal("10.00"))],
        "order_date date, order_count long, revenue decimal(28,2)",
    )

    actual = completed_order_metrics(source)
    assertDataFrameEqual(actual, expected, checkRowOrder=False)
    assertSchemaEqual(actual.schema, expected.schema)
```

The test data contains one completed and one cancelled order on the same date. The expected result therefore contains one order and 10.00 revenue. `assertDataFrameEqual` compares distributed content without requiring a hand-written `collect`, and row order is ignored because the transformation does not promise order. `assertSchemaEqual` separately catches type drift—for example, a revenue column changing from decimal to double even when the displayed value still looks like 10.0.

When exact output type may widen by a documented Spark rule, assert the intended contract by selecting/casting at the transformation boundary rather than weakening every test.

## What to test

- nominal records;
- empty input with an explicit schema;
- null and blank fields;
- duplicate business keys;
- timestamp boundaries and daylight-saving changes;
- decimal boundaries and rounding;
- unexpected enum values;
- deterministic tie-breaking;
- schema and column order when downstream systems depend on them.

Avoid giant fixture datasets. A few carefully chosen rows can exercise distributed expressions. Integration tests should separately validate actual formats, catalog behavior, and write protocols.

## Property and invariant thinking

Examples prove selected cases; invariants cover whole classes of data:

- cleaning is idempotent: `clean(clean(df)) == clean(df)`;
- an enrichment join preserves the left row count under a many-to-one contract;
- every input is valid or rejected, never both;
- revenue by group sums to the accepted input revenue;
- surrogate keys are stable for identical business inputs.

## Work task: test a transformation

Write a transformation and tests for order normalization. Include malformed amounts, duplicate updates, a null customer, and two updates with the same timestamp.

### Acceptance criteria

- Transformation code performs no I/O or actions.
- Tests use explicit schemas.
- Expected output includes types, not just values.
- Tie handling is deterministic.
- At least one invariant is tested.

Official guide: [Testing PySpark](https://spark.apache.org/docs/4.2.0/api/python/getting_started/testing_pyspark.html).

## Exercises

Complete the [production design and testing exercises](../exercises/03-production-engineering/01-design-and-testing-exercises.md).
