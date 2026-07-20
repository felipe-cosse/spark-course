# Exercises: Distributed Execution

Source: [Distributed execution](../../01-foundations/01-distributed-execution.md)

Estimated time: 60–90 minutes. Difficulty: beginner.

## Key terms reinforced

| Term | Definition |
|---|---|
| Job | Work triggered by an action. |
| Stage | Tasks that can run without another shuffle boundary. |
| Task | Work applied to one partition in one stage. |
| Shuffle | Redistribution of records among partitions. |
| Lineage | The transformation history used for recomputation. |

## Exercise 1: Annotate a plan before execution

Annotate every line as source, narrow transformation, wide transformation, or action:

```python
result = (
    spark.read.parquet("/data/events")
    .filter("event_date >= DATE '2026-07-01'")
    .select("customer_id", "event_type")
    .dropDuplicates(["customer_id", "event_type"])
    .groupBy("event_type")
    .count()
    .orderBy("count", ascending=False)
    .limit(20)
    .collect()
)
```

### Deliverable

The annotated code, likely shuffle boundaries, driver-memory boundary, and expected output grain.

## Exercise 2: Partition experiment

Use `spark.range(0, 1_000, numPartitions=8)`. Record partition count before and after `filter`, `repartition(4, "bucket")`, and `coalesce(2)`. Inspect the plan and explain which operation shuffles.

### Hint

Use `df.rdd.getNumPartitions()` only as an inspection bridge in classic PySpark; do not build production DataFrame logic around RDD conversion.

## Exercise 3: Driver-safety review

Rewrite three unsafe requirements:

- “Collect all customer histories and email them.”
- “Convert the full 2 TB table to pandas for a chart.”
- “Log every invalid record from the driver.”

Propose distributed outputs and explicit bounded samples.

## Self-check

- Did you distinguish `groupBy().count()` from `DataFrame.count()`?
- Did you connect `Exchange` operators to stages?
- Did you state where data changes from distributed to local?
- Did every collection have a defensible bound?

## Stretch task

Explain why two actions against the same uncached DataFrame can create separate jobs and when caching would or would not help.
