# Glossary

## Key terms on this page

| Term | Definition |
|---|---|
| Glossary | A reference list that defines specialized terms used by a course or domain. |
| Abstraction | A simplified model that exposes useful behavior while hiding lower-level detail. |
| Semantics | The meaning and behavior of an operation, beyond its spelling or syntax. |
| Execution plan | Spark's representation of requested operations and the strategy selected to run them. |
| Distributed system | A system whose cooperating processes communicate and fail independently across machines/processes. |
| Fault tolerance | The ability to continue, retry, or recover correct work after a component failure. |
| Data contract | An owned agreement about a dataset's structure, meaning, quality, and compatibility. |

Use the glossary to connect terms, not to memorize isolated definitions. For example: an **action** makes the **driver** schedule a **job**; the job is divided into **stages** at **shuffle** boundaries; each stage runs **tasks** over **partitions**. Reading that chain explains execution more effectively than recalling each word separately.

**Action** — Operation that requests a result or write and therefore triggers execution, such as `count`, `collect`, or a DataFrame write.

**Adaptive Query Execution (AQE)** — Runtime re-optimization that can coalesce shuffle partitions, change some join strategies, and mitigate skew based on observed statistics.

**Catalyst** — Spark SQL's query analysis and optimization framework.

**Checkpoint** — Durable progress/state metadata used for recovery; especially important in Structured Streaming.

**Cluster manager** — System that allocates resources for Spark applications, such as Kubernetes, YARN, or Spark standalone.

**DataFrame** — Distributed table-like collection with named, typed columns and an optimizable logical plan.

**Data grain** — What one row represents. Grain should be stated at every important boundary.

**Driver** — Process that owns the Spark application, plans work, schedules tasks, and coordinates results.

**Executor** — Process that runs tasks and holds application shuffle/cache data.

**Exchange** — Physical-plan operator that redistributes data, normally indicating a shuffle.

**Idempotency** — Property that repeating the same logical operation produces the same target state.

**Job** — Work triggered by an action and divided into stages.

**Lazy evaluation** — Transformations build a plan and do not compute results until an action requires them.

**Lineage** — Description of how a dataset derives from its inputs, used for recomputation and reasoning.

**Narrow transformation** — Transformation where each output partition depends on a small number (often one) of input partitions without full redistribution.

**Partition** — Logical slice of distributed data processed by one task in a stage.

**Processing time** — Time at which the streaming engine processes an event, distinct from event time.

**RDD** — Resilient Distributed Dataset, Spark's lower-level distributed collection API. Useful for legacy and specialized work but lacks DataFrame query optimization.

**Shuffle** — Network/disk redistribution of records between partitions, required by many joins, aggregations, sorts, and repartitions.

**Skew** — Uneven distribution in which one or a few partitions contain much more work than others.

**Stage** — Set of tasks that can run without crossing another shuffle boundary.

**State store** — Durable/intermediate state maintained for stateful streaming operations across micro-batches.

**Task** — Smallest scheduled unit of Spark work; one task processes one partition for a stage.

**Transformation** — Operation that returns a new DataFrame/RDD and contributes to a lazy plan.

**Event time** — Business time carried by an event, distinct from when Spark receives or processes it.

**Watermark** — Streaming mechanism that tracks event-time progress with an allowed lateness threshold, enabling bounded state for supported operations.

**Wide transformation** — Transformation that requires records to be redistributed across partitions.

## Exercises

Complete the [glossary and concept-connection exercises](../exercises/reference/glossary-exercises.md).
