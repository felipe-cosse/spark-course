# SparkSession and the First DataFrame

## Key terms on this page

| Term | Definition |
|---|---|
| SparkSession | The application entry point for DataFrames, SQL, catalogs, and Structured Streaming. |
| DataFrame | A lazy, distributed table with named, typed columns. |
| Schema | The ordered definition of column names, data types, and nullability. |
| Column expression | A symbolic description of a calculation to perform on every relevant distributed row. |
| Literal | A fixed value embedded in a Spark expression, commonly created with `lit`. |
| Projection | Selection or calculation of output columns, normally expressed with `select`. |
| Transformation | An operation that extends the lazy plan and returns a new DataFrame. |
| Action | An operation that makes Spark execute a plan to return or persist a result. |
| Temporary view | A session-scoped name that lets SQL query a DataFrame. |
| Grain | What one row represents before and after a transformation. |

## Objectives

- Configure a local session without hiding production decisions.
- Create and inspect DataFrames.
- Distinguish column expressions from Python values.
- Recognize transformations and actions.

## Session lifecycle

`SparkSession` is the entry point for DataFrames, SQL, catalogs, and streaming:

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("orders-training")
    .master("local[*]")
    .config("spark.sql.session.timeZone", "UTC")
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)
```

Each builder call records configuration; it does not represent a separate Spark application. `master("local[*]")` requests local execution using all logical cores, `appName` provides an identity visible in the UI, and the two `config` calls set course-friendly time and shuffle behavior. `getOrCreate()` is the point at which Spark returns a session, possibly reusing an existing compatible context.

In a submitted cluster job, deployment configuration normally belongs in `spark-submit`, the platform job definition, or approved configuration—not scattered through transformation functions.

## Create a DataFrame

```python
from datetime import datetime
from decimal import Decimal

orders = spark.createDataFrame(
    [
        ("o-100", "c-1", datetime(2026, 7, 18, 10, 0), "COMPLETE", Decimal("42.50")),
        ("o-101", "c-2", datetime(2026, 7, 18, 10, 5), "CANCELLED", Decimal("18.00")),
        ("o-102", "c-1", datetime(2026, 7, 19, 9, 30), "COMPLETE", Decimal("75.25")),
    ],
    "order_id string, customer_id string, ordered_at timestamp, status string, amount decimal(12,2)",
)

orders.printSchema()
orders.show(truncate=False)
```

The five-field schema tells Spark and the reader what each tuple position means. `Decimal("42.50")` matches `decimal(12,2)`, preserving cents without binary floating-point rounding. `printSchema()` displays metadata and `show()` displays rows; neither should be mistaken for a full data-quality test. Notice that `show()` is an action, while constructing `orders` only prepares distributed data.

Explicit schemas prevent an input sample from accidentally deciding a production type.

## Column expressions

```python
import pyspark.sql.functions as F

complete_orders = (
    orders
    .filter(F.col("status") == F.lit("COMPLETE"))
    .select(
        "order_id",
        "customer_id",
        F.to_date("ordered_at").alias("order_date"),
        F.col("amount"),
        (F.col("amount") * F.lit(100)).cast("long").alias("amount_cents"),
    )
)
```

Follow one input row through the expressions. A cancelled order fails the filter and disappears. A complete order retains its identifiers, converts `ordered_at` to a calendar date, and multiplies its decimal amount by 100 before casting to an integer number of cents. The code still has not executed until a later action. Because every operation is a Spark expression, the optimizer can see the filter and projections together.

`F.col("amount") * 100` constructs a distributed expression. It does not multiply Python objects immediately. Prefer built-in expressions because Spark can analyze and optimize them.

Avoid ambiguous attribute access for generated or unusual column names. `F.col("order.total")` can mean nested access; use renamed, predictable column names at data boundaries.

## Transformations and actions

Common transformations include `select`, `withColumn`, `filter`, `join`, `groupBy`, and `orderBy`. Common actions include `show`, `count`, `first`, `collect`, and writes.

```python
complete_orders.explain(mode="formatted")  # inspection
complete_orders.show()                     # action
```

`explain` prints the plan. It does not materialize all result rows.

## Temporary views and SQL

```python
orders.createOrReplaceTempView("orders")

spark.sql("""
    SELECT customer_id, SUM(amount) AS revenue
    FROM orders
    WHERE status = 'COMPLETE'
    GROUP BY customer_id
""").show()
```

`createOrReplaceTempView` gives the existing DataFrame a SQL name; it does not copy the rows into another database. The query filters complete orders, groups them by customer, and produces one row per customer. The final `show()` triggers the SQL plan. The equivalent DataFrame and SQL versions can therefore be compared by their plans rather than by assumptions about language style.

DataFrame and SQL expressions use the same Spark SQL engine. Choose based on team readability and composition, not a belief that one always runs faster.

## Work task: daily operations view

Create a DataFrame with one row per `order_date` containing:

- complete order count;
- complete revenue as `decimal(18,2)`;
- distinct complete customers;
- average complete order value.

Add at least one null amount to the input and document how each metric treats it.

### Acceptance criteria

- Output grain is explicitly one row per date.
- Cancelled orders do not contribute.
- Money does not pass through a binary floating-point type.
- The code uses built-in column functions, not a Python UDF.
- The output is deterministically ordered only at the presentation boundary.

Next: [schemas and types](03-schemas-and-types.md).

## Exercises

Complete the [SparkSession and DataFrame exercises](../exercises/01-foundations/02-sessions-and-first-dataframe-exercises.md).
