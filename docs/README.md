# PySpark 4.2: From First DataFrame to Production Systems

This is a practical, Markdown-first course for data engineers, analytics engineers, data scientists, and Python developers. It starts with the distributed execution model, builds fluency with DataFrames and SQL, and then moves into testing, tuning, streaming, deployment, incident response, and Spark 4.2's modern Python APIs.

The examples target **Apache Spark 4.2.0**, **Python 3.10+**, and **Java 17+**. The course favors DataFrames and SQL for production work. RDDs are explained so that learners can read older systems and understand Spark internals, but they are not the default interface for new pipelines.

## Key terms on this page

| Term | Definition |
|---|---|
| PySpark | Apache Spark's Python API, used to describe distributed data processing with Python. |
| DataFrame | A distributed table with named, typed columns whose operations Spark can optimize. |
| Spark SQL | Spark's engine and APIs for processing structured data through SQL or DataFrame expressions. |
| RDD | Resilient Distributed Dataset, Spark's lower-level distributed collection abstraction. |
| Structured Streaming | Spark's incremental processing engine built on DataFrames and Spark SQL. |
| Production system | A system operated for real users or business processes, with reliability, security, and support obligations. |
| API | Application Programming Interface: the classes, functions, and methods code uses to interact with a system. |
| Capstone | A larger final project that combines multiple course skills into one assessed deliverable. |

Read this page as the course's navigation contract. The map shows where a concept is first taught, while the capstones show where the same concept must be applied without step-by-step instructions. If a later page uses an unfamiliar term, first check its local definitions table and then the [shared glossary](reference/glossary.md).

## What you will be able to do

By the end, you will be able to:

- explain jobs, stages, tasks, partitions, shuffles, lazy evaluation, and fault recovery;
- build typed batch pipelines with DataFrames and SQL;
- select safe join, aggregation, partitioning, and file-layout strategies;
- test transformation logic and enforce data contracts;
- diagnose skew, spills, out-of-memory failures, slow jobs, and small-file problems;
- design recoverable Structured Streaming applications with event-time semantics;
- package and operate jobs with `spark-submit` in a cluster environment;
- decide when to use Arrow UDFs, pandas API on Spark, Spark Connect, Python Data Sources, MLlib, and Spark Declarative Pipelines;
- deliver a production-minded capstone with tests, observability, runbooks, and an architecture decision record.

## Course map

| Phase | Modules | Outcome |
|---|---|---|
| Start | [Course plan](00-getting-started/01-course-plan.md), [setup](00-getting-started/02-setup.md) | A working local environment and a study plan |
| Foundations | [Distributed model](01-foundations/01-distributed-execution.md), [sessions and DataFrames](01-foundations/02-sessions-and-first-dataframe.md), [schemas](01-foundations/03-schemas-and-types.md), [RDDs and shared variables](01-foundations/04-rdds-and-shared-variables.md) | Correct mental models and typed data |
| DataFrames & SQL | [Transformations](02-dataframes-sql/01-transformations.md), [aggregations](02-dataframes-sql/02-aggregations-and-windows.md), [joins](02-dataframes-sql/03-joins.md), [storage](02-dataframes-sql/04-storage-and-semi-structured-data.md), [SQL](02-dataframes-sql/05-sql-and-catalogs.md) | A complete batch-processing toolkit |
| Production engineering | [Design and tests](03-production-engineering/01-design-and-testing.md), [quality](03-production-engineering/02-data-quality-and-idempotency.md), [performance](03-production-engineering/03-performance-tuning.md), [debugging](03-production-engineering/04-debugging-and-observability.md), [deployment](03-production-engineering/05-deployment-security-and-cost.md) | Maintainable, diagnosable jobs |
| Streaming | [Model](04-structured-streaming/01-streaming-model.md), [state and time](04-structured-streaming/02-state-watermarks-and-joins.md), [operations](04-structured-streaming/03-production-streaming.md) | Recoverable event pipelines |
| Advanced APIs | [Arrow and pandas](05-advanced-apis/01-arrow-udfs-and-pandas.md), [modern APIs](05-advanced-apis/02-connect-data-sources-and-pipelines.md), [MLlib](05-advanced-apis/03-mllib-pipelines.md) | Informed API and architecture choices |
| Workplace cases | [Batch ETL](06-real-world-cases/01-orders-batch-etl.md), [incremental/CDC](06-real-world-cases/02-incremental-and-cdc.md), [streaming design](06-real-world-cases/03-streaming-fraud-design.md), [performance incident](06-real-world-cases/04-performance-incident.md) | Work-sample artifacts and operational judgment |
| Capstones | [Batch platform](07-capstones/01-batch-capstone.md), [streaming platform](07-capstones/02-streaming-capstone.md), [rubric](07-capstones/03-rubric-and-review.md) | Portfolio-ready evidence |

Quick references: [PySpark cheat sheet](reference/cheat-sheet.md), [troubleshooting decision tree](reference/troubleshooting.md), [glossary](reference/glossary.md), and [sources](reference/references.md).

## How to study

For each lesson:

1. Read the scenario and concepts without running code.
2. Predict where execution happens and where a shuffle occurs.
3. Run the example in `pyspark`, a notebook, or a Python file.
4. Complete the work task without copying the solution pattern blindly.
5. Check the acceptance criteria and record one trade-off you made.

Use small local data to validate correctness. Scale is a property of the execution plan and the production environment; generating millions of local rows is not a substitute for understanding either.

The most important learning habit is to narrate each example before running it: identify the input grain, describe the output grain, predict which line causes data movement, and name the action that triggers execution. After running it, compare that prediction with `explain()` and the Spark UI. This turns code copying into transferable reasoning.

## Conventions

- `spark` means an active `SparkSession`.
- Examples use explicit imports such as `import pyspark.sql.functions as F` so column expressions remain distinguishable from Python built-ins.
- Paths under `/tmp/pyspark-course/` are disposable local examples. Replace them with approved storage URIs at work.
- Functions return DataFrames and avoid actions where possible. Calling code owns reads, writes, metrics, and retries.
- A statement marked **production note** identifies a behavior that should become an explicit team decision.

## Version policy

The course is pinned conceptually to Spark 4.2.0. The Apache documentation's `latest` URLs currently identify themselves as 4.2.0, but `latest` will move when Spark releases another version. For long-lived training, use the versioned API link in [the references](reference/references.md) and review the migration guide before upgrading.

## Exercises

Complete the [course-home and learning-strategy exercises](exercises/course-home-exercises.md), or open the [complete exercise index](exercises/README.md).
