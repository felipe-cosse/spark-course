# Exercises: Spark Connect, Data Sources, and Declarative Pipelines

Source: [Connect, Data Sources, and Declarative Pipelines](../../05-advanced-apis/02-connect-data-sources-and-pipelines.md)

Estimated time: 110–170 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Spark Connect | Client/server DataFrame protocol using unresolved plans. |
| Data source | Connector abstraction for reading/writing formats or systems. |
| Input partition | One source unit assigned to a Spark task. |
| Declarative pipeline | Desired dataset graph rather than imperative execution sequence. |
| Materialized view | Persisted result maintained from a defining query. |

## Exercise 1: Architecture selection

For remote analyst notebooks, a proprietary object store, and 40 interdependent datasets, decide independently whether to adopt Connect, a Python Data Source, and SDP. Record benefits, unsupported boundaries, authentication, testing, rollback, and ownership.

## Exercise 2: Connect migration audit

Review a classic PySpark design that uses `SparkContext`, RDDs, JVM access, UDFs, streaming, and catalog operations. Classify each API as supported, needing verification, or incompatible with Connect. Use the versioned API reference as evidence.

## Exercise 3: Partition-aware data source design

Extend the teaching data source on paper or in code to read 100 source shards exactly once each. Define option parsing, schema, input partition planning, executor reads, retries, secrets, errors, and tests for overlap/gaps.

## Exercise 4: Declarative pipeline

Define SDP datasets for raw orders, valid orders, rejected orders, and daily revenue. Ensure dataset functions return DataFrames and contain no actions, writes, or side effects. Sketch the pipeline YAML and dry-run/release flow.

## Self-check

- Is Connect authentication supplied by the deployment boundary?
- Does each data-source partition own a non-overlapping range?
- Are connector objects pickle-serializable?
- Can SDP definitions be evaluated repeatedly without side effects?

## Stretch task

Write an ADR comparing normal orchestrated PySpark jobs with SDP for this dataset graph, including migration and exit costs.
