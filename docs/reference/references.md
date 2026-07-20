# References and Source Notes

## Key terms on this page

| Term | Definition |
|---|---|
| Normative source | The authority this course follows when technical sources disagree. |
| Primary source | Original documentation, specification, code, or research from the responsible project/author. |
| Supplementary source | Material used for another explanation, example, or perspective rather than final authority. |
| Versioned documentation | Documentation fixed to a named software release instead of moving with `latest`. |
| Migration guide | Documentation describing behavior, dependency, and compatibility changes between versions. |
| Provider-specific | Behavior or advice tied to a particular managed platform rather than Apache Spark generally. |
| Compatibility | The ability of code, data, state, or clients to continue working across a change. |
| API reference | Detailed signatures and contracts for classes, functions, and methods. |

Use the sources in a hierarchy. First verify exact API behavior in the versioned Apache reference, then use programming guides for semantics, then consult provider documentation for the environment actually deployed. Tutorials and books are valuable explanations, but older code must be checked against the Spark 4.2 migration guide.

## Source policy

Apache Spark 4.2.0 documentation is the normative technical source for this course. The GeeksforGeeks tutorial is used as a supplementary beginner-friendly topic inventory. Where supplementary material differs from current Spark guidance, this course follows Spark 4.2.0—for example, it teaches Structured Streaming rather than presenting the legacy DStream API as the default.

The `latest` Apache URLs currently render PySpark 4.2.0 but will move in the future. Links below are versioned whenever the Spark site provides the path.

## Core Apache Spark 4.2.0 documentation

- [PySpark 4.2.0 API overview](https://spark.apache.org/docs/4.2.0/api/python/index.html) — official entry point requested for the course.
- [Getting started](https://spark.apache.org/docs/4.2.0/api/python/getting_started/index.html) — installation, DataFrames, Connect, pandas API, and testing.
- [Installation](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html) — Python/Java and optional dependency requirements.
- [PySpark user guide](https://spark.apache.org/docs/4.2.0/api/python/user_guide/index.html) — DataFrames, types, functions, debugging, UDFs, SQL, and storage.
- [PySpark tutorials](https://spark.apache.org/docs/4.2.0/api/python/tutorial/index.html) — packaging, Arrow, UDF/UDTF, Data Sources, and pandas API on Spark.
- [PySpark API reference](https://spark.apache.org/docs/4.2.0/api/python/reference/index.html) — exact classes and signatures.
- [PySpark 4.2 migration guide](https://spark.apache.org/docs/4.2.0/api/python/migration_guide/pyspark_upgrade.html) — Arrow defaults and compatibility changes.
- [Spark SQL and DataFrames](https://spark.apache.org/docs/4.2.0/sql-programming-guide.html) — structured processing model.
- [SQL reference](https://spark.apache.org/docs/4.2.0/sql-ref.html) — syntax, functions, types, nulls, and ANSI behavior.
- [SQL performance tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html) — caching, partitions, joins, statistics, and AQE.
- [Structured Streaming guide](https://spark.apache.org/docs/4.2.0/streaming/index.html) — event-time, state, output, recovery, and operations.
- [MLlib guide](https://spark.apache.org/docs/4.2.0/ml-guide.html) — DataFrame-based machine learning.
- [Cluster overview](https://spark.apache.org/docs/4.2.0/cluster-overview.html) — drivers, executors, and cluster managers.
- [Configuration](https://spark.apache.org/docs/4.2.0/configuration.html), [tuning](https://spark.apache.org/docs/4.2.0/tuning.html), and [monitoring](https://spark.apache.org/docs/4.2.0/monitoring.html).
- [Submitting applications](https://spark.apache.org/docs/4.2.0/submitting-applications.html), [Kubernetes](https://spark.apache.org/docs/4.2.0/running-on-kubernetes.html), and [security](https://spark.apache.org/docs/4.2.0/security.html).
- [Spark Connect](https://spark.apache.org/docs/4.2.0/spark-connect-overview.html), [Python Data Source API](https://spark.apache.org/docs/4.2.0/api/python/tutorial/sql/python_data_source.html), and [Spark Declarative Pipelines](https://spark.apache.org/docs/4.2.0/declarative-pipelines-programming-guide.html).

## Requested tutorial

- [GeeksforGeeks PySpark Tutorial](https://www.geeksforgeeks.org/python/pyspark-tutorial/) — introductory coverage of setup, RDDs/DataFrames, column operations, cleaning, joins, aggregations, MLlib, and partitioning. Last updated July 18, 2025 when reviewed for this course.

## Coverage map

| Source area | Course coverage |
|---|---|
| PySpark setup and quickstart | Setup, sessions, first DataFrame |
| Spark Core and RDD basics | Distributed execution; RDDs and shared variables |
| DataFrame creation and schemas | Sessions; schemas, types, nulls, and time |
| Column operations, filtering, cleaning, arrays | Transformations; storage and semi-structured data |
| Aggregations, sorting, pivots | Aggregations and windows |
| Join types and multi-column joins | Joins, grain, cardinality, broadcast, and skew |
| Partitioning and performance | Storage/file layout; evidence-led tuning; performance incident |
| UDFs and Python integration | Arrow, UDFs, UDTFs, and pandas API on Spark |
| SQL | SQL, views, catalogs, parameterization, and plans |
| Streaming | Structured Streaming, state/time, and production operations |
| MLlib | DataFrame-based ML Pipelines and model operations |
| Spark 4.2 modern APIs | Spark Connect, Python Data Source API, Declarative Pipelines |
| Workplace readiness | Testing, quality, idempotency, deployment, security, cost, cases, and capstones |

## Additional learning references

- [Learning Spark, 2nd Edition repository](https://github.com/databricks/LearningSparkV2) — runnable examples accompanying the O'Reilly book by Damji, Wenig, Das, and Lee. Examples target an earlier Spark generation, so adapt and test against 4.2.
- [High Performance Spark examples](https://github.com/high-performance-spark/high-performance-spark-examples) — performance-oriented companion examples; older APIs require version judgment.
- [Apache Spark examples source](https://github.com/apache/spark/tree/v4.2.0/examples/src/main/python) — official runnable Python examples for the exact release tag.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/) — source-side semantics, security, retention, and operations for Kafka-backed streaming.
- [Kubernetes documentation](https://kubernetes.io/docs/home/) — platform concepts and security when deploying Spark on Kubernetes.
- [AWS Prescriptive Guidance: Spark tuning](https://docs.aws.amazon.com/prescriptive-guidance/latest/tuning-aws-glue-for-apache-spark/introduction.html) — practical workload evidence and AWS Glue examples; translate service-specific settings carefully.
- [Google Cloud Dataproc Spark performance](https://cloud.google.com/dataproc/docs/support/spark-job-tuning) — operational tuning guidance for Dataproc; separate general Spark principles from provider defaults.
- [Databricks Spark UI guide](https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/) — visual diagnosis examples; some interface/features are platform-specific.

## How to use references

1. Start with the lesson's business problem and run its compact example.
2. Use the versioned PySpark API reference for signatures and supported behavior.
3. Use programming guides for semantics and constraints.
4. Consult provider material only after identifying the deployed runtime and storage/catalog.
5. Verify old books/blogs against the 4.2 migration guide before copying configuration or code.

## Maintenance checklist

When updating the course for a new Spark release:

- update Python, Java, pandas, PyArrow, and optional dependency minimums;
- read PySpark, SQL, and pandas API migration guides;
- validate every code block against the new runtime;
- review default changes such as ANSI and Arrow behavior;
- re-check Structured Streaming state/checkpoint compatibility;
- review Connect API coverage and Declarative Pipelines maturity;
- replace versioned links and mark intentionally historical references.

## Exercises

Complete the [source evaluation and research exercises](../exercises/reference/references-exercises.md).
