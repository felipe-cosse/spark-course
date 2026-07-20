# Performance Tuning from Evidence

## Key terms on this page

| Term | Definition |
|---|---|
| Baseline | A measured reference run used to compare later changes. |
| Bottleneck | The resource or operation that currently limits overall throughput or runtime. |
| Physical plan | Spark's selected execution operators, including exchanges, joins, scans, and aggregates. |
| Exchange | A physical operator that redistributes data and normally creates a shuffle boundary. |
| Predicate pushdown | Passing a filter to the data source so it can avoid returning irrelevant data. |
| Column pruning | Reading or carrying only columns required by downstream operations. |
| AQE | Adaptive Query Execution, which revises parts of a query plan using runtime statistics. |
| Cache/persist | Retaining computed partitions for reuse instead of recomputing their lineage. |
| Spill | Temporary movement of execution data from memory to disk when an operator needs more memory. |
| GC | Garbage collection: JVM work to reclaim memory occupied by unused objects. |
| Representative data | Test data whose volume, distribution, width, and edge cases resemble the target workload. |

## The tuning loop

1. Define an observable target: runtime, throughput, p95 task time, shuffle bytes, or cost.
2. Capture the physical plan and Spark UI evidence.
3. Identify whether the bottleneck is scan, CPU, shuffle/network, spill/memory, skew, output, or external I/O.
4. Change one material factor.
5. Re-run on representative data and compare correctness plus performance.

Configuration guessing without a baseline creates folklore.

## Read the plan

```python
result.explain(mode="formatted")
result.explain(mode="cost")
```

Formatted mode emphasizes operator structure and fields; cost mode adds optimizer estimates. Start at the scans, follow each branch upward, and mark `Exchange`, join, aggregate, and sort operators. Then compare estimated sizes with observed stage input and shuffle metrics. A large disagreement can explain why Spark selected a strategy that looks unreasonable after execution.

Look for:

- `Exchange` — a shuffle boundary;
- scan filters and partition/data filters — evidence of pushdown or pruning;
- join strategy — broadcast hash, sort-merge, and others;
- sorts and aggregates;
- estimated sizes and row counts;
- adaptive plan sections after execution.

## Reduce work early

Select required columns and apply safe filters before expensive joins or aggregations. Spark can often push filters and column pruning into the data source.

```python
needed = (
    spark.read.parquet(source_path)
    .select("order_id", "customer_id", "order_date", "amount")
    .filter(F.col("order_date").between(start_date, end_date))
)
```

The projection states that only four columns can matter downstream. The date predicate restricts the business range. With compatible Parquet metadata and a direct partition/data-column filter, Spark can prune directories, row groups, and columns before expensive processing. Confirm the scan's `PartitionFilters`, `PushedFilters`, and `ReadSchema` rather than assuming the source accepted every optimization.

Do not apply a Python UDF to a partition/filter column before filtering; it can hide optimization opportunities.

## Partition sizing

Too few partitions can leave cores idle and make per-task memory huge. Too many tiny partitions increase scheduling and file overhead.

- input partitioning follows files, blocks, and read configuration;
- shuffle partitioning is controlled by SQL settings and Adaptive Query Execution (AQE);
- output partitioning determines writer concurrency and contributes to file count.

Tune with input bytes, row width, operation type, spill, task duration, and cluster cores—not row count alone.

## Adaptive Query Execution

AQE can coalesce post-shuffle partitions, change some join strategies at runtime, and mitigate skewed shuffle partitions. Verify it is enabled in the environment and inspect the final adaptive plan. AQE is powerful, but it does not fix bad keys, accidental cross joins, or unbounded data expansion.

## Cache only reused, expensive intermediates

```python
from pyspark import StorageLevel

base = expensive_transform(source).persist(StorageLevel.MEMORY_AND_DISK)
try:
    write_a(base)
    write_b(base)
finally:
    base.unpersist()
```

`persist` marks the intermediate for retention, but it is populated only when `write_a` performs an action. `write_b` can then reuse cached partitions instead of rerunning `expensive_transform`. `MEMORY_AND_DISK` allows partitions that do not fit in memory to spill to local disk. The `finally` block releases storage even if a write fails. Compare this design with two uncached runs because cache serialization and memory pressure can cost more than recomputation.

Caching a DataFrame used once adds work. Materialization occurs on an action, and cached data consumes executor storage memory. Measure reuse and unpersist deliberately.

## Built-ins before Python UDFs

Built-in expressions are visible to Catalyst and avoid many Python serialization boundaries. Spark 4.2 uses Arrow by default for regular Python UDF exchange, which improves many workloads but does not make opaque row logic equivalent to native expressions.

Decision order:

1. built-in SQL/DataFrame function;
2. combination of higher-order functions and SQL expressions;
3. pandas/Arrow UDF for vectorizable logic;
4. regular Python UDF only when justified and measured.

## Avoid common traps

- `repartition(1)` for convenience serializes output through one partition.
- `groupByKey`-style logic can hold large values per key; aggregate incrementally.
- global `orderBy` is expensive and usually belongs at a presentation boundary.
- repeated actions can recompute uncached lineage.
- `count()` just to log progress scans data.
- a broadcast hint can crash executors when “small” was guessed incorrectly.

## Work task: performance memo

Take a join-and-aggregate job and produce a before/after memo containing input sizes, plan excerpts, stage metrics, bottleneck hypothesis, one change, correctness comparison, and cost/runtime result.

### Acceptance criteria

- The baseline and experiment use representative data.
- The change follows evidence from a plan or stage metric.
- Correctness is compared, not assumed.
- Configuration values are scoped and explained.
- The memo distinguishes faster execution from lower total compute cost.

Official references: [SQL performance tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html), [Spark tuning](https://spark.apache.org/docs/4.2.0/tuning.html), and [configuration](https://spark.apache.org/docs/4.2.0/configuration.html).

## Exercises

Complete the [evidence-led performance exercises](../exercises/03-production-engineering/03-performance-tuning-exercises.md).
