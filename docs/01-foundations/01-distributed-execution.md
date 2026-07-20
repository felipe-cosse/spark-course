# Distributed Execution: The Mental Model

## Key terms on this page

| Term | Definition |
|---|---|
| Driver | The process that builds plans, requests resources, schedules work, and coordinates one Spark application. |
| Cluster manager | The service that grants compute resources to Spark applications. |
| Executor | A process that runs tasks and stores application-specific cache or shuffle data. |
| Partition | A logical slice of distributed data processed by one task in a stage. |
| Transformation | A lazy operation that describes a new dataset, such as `filter` or `select`. |
| Action | An operation that requests a result or write and therefore triggers execution. |
| Job | The work Spark creates in response to an action. |
| Stage | A group of tasks that can execute without crossing another shuffle boundary. |
| Task | The smallest scheduled unit of work; normally one task processes one partition for a stage. |
| Shuffle | Redistribution of records between partitions, usually across the network and local disk. |
| Lineage | The recorded chain of transformations used to derive a dataset and recompute lost partitions. |
| Lazy evaluation | Building a plan now and executing it only when an action later requires a result. |

## Scenario

A notebook transformation takes two seconds on a sample, but the scheduled job takes 45 minutes and occasionally fails on one executor. Before changing configuration, you need a model that connects Python code to physical work.

## Driver, cluster manager, and executors

- The **driver** creates the `SparkSession`, builds query plans, schedules work, and tracks application state.
- A **cluster manager** allocates resources. Spark can run with its standalone manager, Kubernetes, or YARN; managed services wrap one or more of these choices.
- **Executors** run tasks and store cached or shuffle data for one Spark application.
- A **partition** is a logical chunk of a distributed dataset. One task processes one partition for one stage.

Do not confuse executor processes with machines: a node may run multiple executors, and local mode can run executor work inside one machine.

## Lazy evaluation

Transformations build a plan:

```python
import pyspark.sql.functions as F

planned = (
    spark.range(1_000)
    .filter(F.col("id") % 2 == 0)
    .withColumn("bucket", F.col("id") % 10)
    .groupBy("bucket")
    .count()
)
```

No result is computed until an action such as `show`, `count`, `collect`, `write`, or `first` requires it. Lazy evaluation lets Spark optimize the complete logical plan instead of executing line by line.

Walk through the plan before running it. `range` supplies distributed input partitions. `filter` can independently discard odd IDs inside each partition. `withColumn` calculates a bucket from each remaining ID without moving rows. `groupBy("bucket")`, however, needs every row for the same bucket to meet at the same reducer-side partition, so it introduces a shuffle. The final `count` in this expression is an aggregation method that still returns a DataFrame; it is not the standalone `DataFrame.count()` action.

Inspect rather than guess:

```python
planned.explain(mode="formatted")
planned.show()
```

`explain` lets you compare your prediction with Spark's physical operators. `show` then triggers the job. In the Spark UI, connect the `Exchange` in the physical plan to the boundary between stages; doing this repeatedly is how the abstract vocabulary becomes operational intuition.

## Jobs, stages, and tasks

An action normally creates a **job**. Spark divides a job into **stages** at shuffle boundaries. Each stage contains **tasks**, usually one per input partition.

Narrow transformations such as `filter` and many projections can process each input partition independently. Wide transformations such as `groupBy`, `distinct`, repartitioning, and most joins need related rows to move across the network in a **shuffle**.

```text
read partitions -> filter/select stage -> shuffle -> aggregate stage -> result
```

A shuffle is not automatically bad. It is often necessary. The engineering question is whether the shuffle is required, balanced, and sized for available resources.

## Fault tolerance and lineage

Spark remembers how partitions were derived. If an executor loses a partition, Spark can recompute it from lineage rather than replicating every intermediate result. Checkpoints and durable outputs cut lineage or preserve recoverable progress in cases such as stateful streaming.

## Driver safety

`collect()` and `toPandas()` bring all result rows to the driver. They are acceptable only when the result is deliberately bounded and that bound is part of the contract.

Prefer:

```python
planned.show(20, truncate=False)
sample = planned.limit(100).collect()
```

`limit(100).collect()` communicates a bound. It still launches work, but it does not ask the driver to hold the entire dataset.

## Partitions are not files

A read may map files or file blocks to partitions. A write often emits at least one data file per output task. Partitions are an execution concept; files are a storage concept. They influence each other but are not interchangeable.

## Work task: predict the plan

For the pipeline below, identify transformations, actions, likely shuffle boundaries, and the component that receives the final Python list:

```python
result = (
    spark.read.parquet("/data/orders")
    .filter("status = 'COMPLETE'")
    .groupBy("country")
    .sum("amount")
    .orderBy("country")
    .collect()
)
```

To reason through this example, first mark `read`, `filter`, `groupBy`, `sum`, and `orderBy` as plan construction. Then identify `collect` as the action and as a change of location: distributed rows become a Python list in driver memory. The aggregation groups by country, while `orderBy` needs a global ordering of the grouped result. Even if only 250 countries are expected, enforce that bound before collection so an upstream contract failure cannot unexpectedly exhaust the driver.

Then replace the unbounded collection with a safer output strategy for a report that has a guaranteed maximum of 250 countries.

### Acceptance criteria

- You identify `collect` as the action and driver-memory boundary.
- You identify aggregation and global ordering as likely shuffle operations.
- Your revision makes the 250-row business bound explicit and fails or alerts if the contract is violated.

## Review questions

1. Why can two actions against the same uncached DataFrame repeat work?
2. Why does increasing executor memory not fix a single severely skewed partition?
3. When is a shuffle necessary for correctness?

Further reading: [Spark cluster overview](https://spark.apache.org/docs/4.2.0/cluster-overview.html), [RDD programming guide](https://spark.apache.org/docs/4.2.0/rdd-programming-guide.html), and [Spark tuning](https://spark.apache.org/docs/4.2.0/tuning.html).

## Exercises

Complete the [distributed-execution exercises](../exercises/01-foundations/01-distributed-execution-exercises.md).
