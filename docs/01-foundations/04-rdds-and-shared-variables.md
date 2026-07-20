# RDDs and Shared Variables

## Key terms on this page

| Term | Definition |
|---|---|
| RDD | Resilient Distributed Dataset, an immutable distributed collection with lineage. |
| Pair RDD | An RDD whose elements are key/value pairs and therefore support keyed operations. |
| Closure | A function together with external variables it captures for execution on workers. |
| `mapPartitions` | A transformation that calls a function once per partition and iterates over that partition's rows. |
| `reduceByKey` | A keyed aggregation that combines values locally before shuffling partial results. |
| `groupByKey` | A keyed operation that brings every value for a key together without pre-aggregation. |
| Broadcast variable | A read-only value distributed efficiently to executors for repeated task access. |
| Accumulator | A driver-readable variable to which tasks can add values, mainly for diagnostics. |
| Serialization | Conversion of code or data into a form that can cross a process or network boundary. |
| Lineage | The transformation history Spark can use to recompute an RDD partition. |

## Why learn RDDs?

Resilient Distributed Datasets are Spark's lower-level distributed collection API. You will encounter them in older pipelines, unstructured algorithms, and discussions of lineage and partitions. For new structured work, prefer DataFrames: Spark can understand their schema and expressions and optimize their plans. Spark Connect does not support `SparkContext` or RDD APIs.

## Basic lifecycle

```python
sc = spark.sparkContext

numbers = sc.parallelize(range(1, 11), 4)

even_squares = (
    numbers
    .filter(lambda value: value % 2 == 0)
    .map(lambda value: value * value)
)

assert even_squares.reduce(lambda left, right: left + right) == 220
```

`parallelize` divides the numbers 1 through 10 into four partitions. Each task filters and squares its local values, producing 4, 16, 36, 64, and 100 across the cluster. `reduce` is the action: it combines those distributed values until one driver result, 220, remains. The lambdas are serialized and executed in Python workers, not applied by a local Python loop on the driver.

`filter` and `map` are lazy transformations. `reduce` is an action. Python functions execute in Python workers on executor-side partitions, so their code and captured variables must be serializable.

## Pair RDDs

```python
orders = sc.parallelize([
    ("c1", 10),
    ("c1", 15),
    ("c2", 8),
])

totals = orders.reduceByKey(lambda left, right: left + right)
assert dict(totals.collect()) == {"c1": 25, "c2": 8}
```

The first tuple element is the key. `reduceByKey` adds values for the same customer and can combine `c1` values inside a source partition before shuffling partial totals. `collect` is safe only because this teaching result has two known keys; on an unbounded customer population, write the distributed totals or retrieve a bounded sample.

Prefer `reduceByKey` or `aggregateByKey` to `groupByKey` when values can be combined incrementally. `groupByKey` transfers and retains every value for a key and can create severe memory pressure.

## Partition-level work

`mapPartitions` initializes expensive resources once per partition rather than once per row:

```python
def normalize_partition(rows):
    for customer_id, amount in rows:
        yield customer_id.strip().lower(), amount

normalized = orders.mapPartitions(normalize_partition)
```

External connections inside tasks require strict rate limits, retry/idempotency behavior, cleanup, and serialization-safe initialization. Partition-level batching does not make arbitrary side effects exactly once.

## Broadcast variables

Broadcast a read-only value when executor tasks repeatedly need a moderately sized local object:

```python
country_names = sc.broadcast({"US": "United States", "CA": "Canada"})

codes = sc.parallelize(["US", "CA", "XX"])
labels = codes.map(lambda code: country_names.value.get(code, "Unknown"))
```

For DataFrame joins, prefer DataFrame broadcast joins so Spark can plan the operation. RDD broadcast values are useful inside RDD/Python logic, but their serialized size must fit executor memory. Call `unpersist` or `destroy` when a large broadcast is no longer needed.

## Accumulators

Accumulators aggregate information from tasks back to the driver, commonly for diagnostics:

```python
invalid_rows = sc.longAccumulator("invalid_rows")

def parse_positive(value):
    if value < 0:
        invalid_rows.add(1)
        return []
    return [value]

accepted = sc.parallelize([1, -1, 2]).flatMap(parse_positive)
accepted.count()
print(invalid_rows.value)
```

`flatMap` allows each input to emit zero or one accepted values here. The negative number increments the accumulator and emits an empty list, so it does not appear in `accepted`. `count()` is essential to the demonstration because lazy transformations do not run before an action. If Spark recomputes a task, however, the increment can occur again; this is why an accumulator is diagnostic rather than a financial or quality ledger.

Tasks can be retried or recomputed, so accumulator updates inside transformations are not a transactional business count. Use DataFrame aggregations and durable metrics for correctness-critical reporting.

## Convert at a clear boundary

```python
typed = normalized.toDF("customer_id string, amount long")
summary = typed.groupBy("customer_id").sum("amount")
```

Move to a DataFrame as soon as data has a stable structure so Catalyst can optimize the remaining work.

## Work task: legacy review

Review an RDD pipeline that uses `groupByKey`, captures a 500 MB Python dictionary, calls an HTTP endpoint per row, and collects all results.

### Acceptance criteria

- Replace structured portions with DataFrame expressions.
- Replace `groupByKey` with an incremental aggregation when semantics allow.
- Give the lookup data a measured broadcast or join strategy.
- Move external side effects behind a durable, idempotent boundary.
- Remove unbounded driver collection.
- State any specialized logic that genuinely remains an RDD.

References: [RDD programming guide](https://spark.apache.org/docs/4.2.0/rdd-programming-guide.html) and [PySpark RDD API](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.html#rdd-apis).

## Exercises

Complete the [RDD and shared-variable exercises](../exercises/01-foundations/04-rdds-and-shared-variables-exercises.md).
