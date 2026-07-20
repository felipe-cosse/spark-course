# DataFrame Transformations and Built-in Functions

## Key terms on this page

| Term | Definition |
|---|---|
| Pure transformation | A function whose output depends only on its input DataFrames/arguments and that performs no hidden I/O or actions. |
| Built-in function | A Spark-provided expression that the SQL engine can analyze and optimize. |
| Projection | The selection, renaming, or calculation of output columns. |
| Normalization | Converting equivalent representations into one consistent representation, such as trimming and lowercasing email. |
| Higher-order function | A function such as `transform` or `filter` that applies a column expression to elements of an array or map. |
| UDF | User-defined function: custom logic treated as a less-transparent execution boundary by Spark. |
| Deduplication | Identifying repeated logical records and retaining or combining them according to an explicit rule. |
| Window | A specification that lets a calculation use related rows while preserving the current row grain. |
| Tie-breaker | A stable secondary ordering field used when the primary ordering values are equal. |
| Output grain | The real-world entity represented by one output row after the transformation. |

## Objectives

- Build readable transformation pipelines.
- Prefer optimizer-visible expressions over Python row logic.
- Handle strings, arrays, structs, conditionals, and dates.
- Preserve a clearly stated output grain.

## Transformations as functions

A maintainable transformation accepts a DataFrame and returns a DataFrame. It does not create a session, read hidden global paths, write output, or call actions.

```python
from pyspark.sql import DataFrame
import pyspark.sql.functions as F

def clean_orders(df: DataFrame) -> DataFrame:
    return (
        df
        .select(
            F.trim("order_id").alias("order_id"),
            F.lower(F.trim("email")).alias("email"),
            F.to_timestamp("ordered_at_raw").alias("ordered_at"),
            F.upper(F.trim("status")).alias("status"),
            F.expr("try_cast(amount_raw AS DECIMAL(18,2))").alias("amount"),
        )
        .withColumn("order_date", F.to_date("ordered_at"))
    )
```

Read the function as a schema boundary. `select` deliberately lists the only output columns. Identifier and status strings are trimmed and normalized, timestamp text is parsed, and `try_cast` converts valid money while leaving invalid text as null for a later quality rule. `withColumn` then derives a date from the parsed timestamp. Because there is no `show`, `count`, read, or write, calling `clean_orders` only returns a new lazy plan and is easy to test with an in-memory fixture.

This shape makes tests cheap: create a tiny input DataFrame, call the function, and compare the result.

## Select and mutate deliberately

`select` is useful at contract boundaries because it makes the complete output schema visible. `withColumn` is useful for a small number of derived fields. Avoid long loops of `withColumn`; build related expressions in one `select` or use `withColumns` when appropriate.

```python
enriched = orders.select(
    "*",
    F.when(F.col("amount") >= 100, "high")
     .when(F.col("amount") >= 50, "medium")
     .otherwise("low")
     .alias("value_band"),
    F.coalesce("campaign", F.lit("organic")).alias("attribution"),
)
```

The value-band expression is evaluated in order: amounts of at least 100 become `high`; among the remaining rows, amounts of at least 50 become `medium`; every other row becomes `low`. A null amount matches neither comparison and therefore also reaches `otherwise("low")`. If null means “unknown,” add an explicit null branch first—this illustrates why code syntax alone cannot decide business semantics.

`coalesce("campaign", lit("organic"))` picks the first non-null value. It does not treat an empty string as null, so normalize blank campaigns separately if the contract considers them missing.

`otherwise` matters: without it, unmatched conditions become null.

## String and regular-expression work

```python
normalized = customers.select(
    "customer_id",
    F.lower(F.trim("email")).alias("email"),
    F.regexp_replace("phone", r"[^0-9]", "").alias("phone_digits"),
    F.split(F.trim("full_name"), r"\s+").alias("name_tokens"),
)
```

A regular expression is not a full email or phone validation standard. Treat normalization and validation as separate concerns.

## Arrays and higher-order functions

Higher-order SQL functions keep element processing inside the execution engine:

```python
tagged = events.withColumn(
    "normalized_tags",
    F.array_distinct(
        F.transform("tags", lambda x: F.lower(F.trim(x)))
    ),
)
```

For every element of `tags`, `transform` trims whitespace and lowercases the value. `array_distinct` then removes repeated normalized tags. The array stays inside one DataFrame row throughout; there is no Python loop and no row explosion. If the input array can itself be null, test the desired null result rather than assuming it behaves like an empty array.

Use `filter`, `transform`, `aggregate`, `exists`, and `forall` for array logic before reaching for a UDF.

## Rows and columns

Spark is column-expression oriented. Python control flow cannot branch on a distributed Column:

```python
# Wrong: a Column has no single truth value on the driver.
# if F.col("amount") > 0: ...

# Correct:
signed = orders.withColumn(
    "direction",
    F.when(F.col("amount") >= 0, F.lit("credit")).otherwise(F.lit("debit")),
)
```

## Deduplication needs a rule

`dropDuplicates(["order_id"])` keeps an arbitrary representative when other columns differ. For deterministic latest-record selection, use a window and a tie-breaker:

```python
from pyspark.sql import Window

latest_first = Window.partitionBy("order_id").orderBy(
    F.col("updated_at").desc(),
    F.col("ingest_sequence").desc(),
)

latest = (
    updates
    .withColumn("_rank", F.row_number().over(latest_first))
    .filter(F.col("_rank") == 1)
    .drop("_rank")
)
```

The window creates a separate ordering for every `order_id`. `row_number` gives rank 1 to the most recent update; `ingest_sequence` resolves equal timestamps. Filtering to rank 1 makes the output one row per order, and dropping the temporary rank restores the intended schema. If both ordering fields can tie, add another stable source identifier—otherwise “latest” remains nondeterministic.

## Work task: reusable customer cleaner

Implement a pure transformation that:

- normalizes email and phone fields;
- parses `preferences_json` into a struct;
- creates `is_contactable` from explicit business rules;
- assigns a deterministic record per `customer_id` from duplicate updates;
- never removes evidence before invalid records can be counted.

### Acceptance criteria

- The output grain is one row per customer.
- Duplicate ordering includes a tie-breaker.
- No Python UDF is used.
- Null and blank strings are distinguished deliberately.
- The function contains no action or I/O.

API guide: [PySpark SQL functions](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.sql/functions.html).

## Exercises

Complete the [DataFrame-transformation exercises](../exercises/02-dataframes-sql/01-transformations-exercises.md).
