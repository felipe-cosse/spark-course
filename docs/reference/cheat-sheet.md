# PySpark 4.2 Cheat Sheet

## Key terms on this page

| Term | Definition |
|---|---|
| DataFrame | A distributed, typed table represented by a lazy query plan. |
| Column | A symbolic expression referring to or deriving a distributed column. |
| Predicate | A Boolean expression used to keep, classify, or join rows. |
| Alias | A chosen name for a DataFrame or output expression. |
| Aggregation | A calculation that combines several rows into summary values. |
| Window | A related-row context that supports ranking, lag, and cumulative calculations without collapsing grain. |
| Action | An operation such as `show`, `count`, or write that triggers execution. |
| Driver | The process coordinating the application and receiving local results. |
| Checkpoint | Durable recovery metadata for a streaming query. |
| Idempotency | The property that a retry produces the same logical target state. |

Use this page after learning a topic, not instead of the lesson. For each snippet, name the input grain, output grain, lazy transformations, and action. Replace placeholder paths and columns only after checking the target schema and write/retry contract.

## Session and inspection

```python
from pyspark.sql import SparkSession, Window
import pyspark.sql.functions as F

spark = SparkSession.builder.appName("app").getOrCreate()
spark.version
spark.conf.get("spark.sql.adaptive.enabled")
df.printSchema()
df.show(20, truncate=False)
df.explain(mode="formatted")
```

Only `show` triggers row computation here. `printSchema` inspects schema metadata, while `explain` inspects the plan. Use all three because values, types, and execution strategy answer different questions.

## Create and select

```python
df = spark.createDataFrame([(1, "A")], "id long, label string")

selected = df.select(
    "id",
    F.col("label").alias("category"),
    F.lit("source-a").alias("source"),
)
```

`select` defines the complete output projection: it keeps `id`, renames `label`, and adds the same source literal to every row. The output remains one row per input row.

## Filter and conditional logic

```python
df.filter(F.col("amount").between(10, 100))
df.filter(F.col("status").isin("COMPLETE", "PENDING"))
df.filter(F.col("value").isNotNull())

df.withColumn(
    "band",
    F.when(F.col("amount") >= 100, "high").otherwise("standard"),
)
```

The filter examples return new DataFrames and remain lazy. In the conditional expression, null amounts fall through to `standard`; add a null branch if that is not the intended business classification.

Remember: `&`, `|`, and `~` combine Column predicates; wrap each comparison in parentheses. Python `and`, `or`, and `not` do not combine distributed Columns.

## Strings, arrays, JSON, and time

```python
F.trim("name")
F.lower("email")
F.regexp_replace("phone", r"[^0-9]", "")
F.split("tags", ",")
F.explode_outer("items")
F.from_json("payload", "id string, items array<struct<sku:string,qty:int>>")
F.to_timestamp("timestamp_raw", "yyyy-MM-dd'T'HH:mm:ssXXX")
F.to_date("event_time")
F.from_utc_timestamp("event_time", "America/Los_Angeles")
```

## Aggregations

```python
df.groupBy("country").agg(
    F.count("*").alias("rows"),
    F.countDistinct("customer_id").alias("customers"),
    F.sum("amount").alias("amount"),
    F.avg("amount").alias("average"),
)
```

This changes grain from input records to one row per country. `count("*")` includes rows containing null fields, `countDistinct("customer_id")` ignores null customer IDs, and `sum`/`avg` ignore null amounts.

## Windows and deterministic latest record

```python
w = Window.partitionBy("id").orderBy(
    F.col("updated_at").desc(),
    F.col("sequence").desc(),
)

latest = (
    df.withColumn("_rn", F.row_number().over(w))
      .filter(F.col("_rn") == 1)
      .drop("_rn")
)
```

The window ranks records independently per ID. The secondary `sequence` field resolves equal update timestamps. Filtering to rank one changes the result to one latest row per ID; ensure the ordering is fully deterministic.

## Joins

```python
left.join(right, "id", "inner")
left.join(right, "id", "left")
left.join(right, "id", "left_semi")
left.join(right, "id", "left_anti")
left.join(F.broadcast(small_dimension), "code", "left")
```

Join syntax does not guarantee cardinality. Validate key uniqueness and unmatched behavior first; use the broadcast hint only after measuring the dimension and checking the physical plan.

Check key uniqueness and output grain before tuning join strategy.

## Read and write

```python
df = spark.read.schema(schema).parquet(path)
df = spark.read.option("header", True).schema(schema).csv(path)

(
    df.write
      .mode("append")
      .partitionBy("event_date")
      .parquet(target)
)
```

Write mode alone does not guarantee idempotency or transactions.

## Testing

```python
from pyspark.testing.utils import assertDataFrameEqual, assertSchemaEqual

assertDataFrameEqual(actual, expected, checkRowOrder=False)
assertSchemaEqual(actual.schema, expected.schema)
```

## Streaming

```python
stream = spark.readStream.format("rate").load()

windowed = (
    stream
    .withWatermark("timestamp", "10 minutes")
    .groupBy(F.window("timestamp", "5 minutes"))
    .count()
)

query = (
    windowed.writeStream
    .outputMode("append")
    .option("checkpointLocation", checkpoint)
    .format("parquet")
    .option("path", target)
    .start()
)
```

The watermark/window pair introduces bounded event-time state for supported semantics. The target path stores results; the checkpoint stores recovery progress. Give each logical output query a unique checkpoint and define sink idempotency before relying on retries.

## Driver-safety reminders

- Bound before `collect()` or `toPandas()`.
- Do not put actions inside transformation functions.
- Avoid `repartition(1)` as an output habit.
- Prefer native expressions over UDFs.
- Inspect the final adaptive plan and stage metrics.

## Exercises

Complete the [cheat-sheet retrieval exercises](../exercises/reference/cheat-sheet-exercises.md).
