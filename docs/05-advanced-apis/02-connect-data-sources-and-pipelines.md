# Spark Connect, Python Data Sources, and Declarative Pipelines

These APIs solve different architecture problems. Use them because the boundary fits, not because they are new.

## Key terms on this page

| Term | Definition |
|---|---|
| Spark Connect | A client/server interface that sends unresolved DataFrame plans to a remote Spark service. |
| gRPC | A remote procedure call protocol used by Spark Connect for client/server communication. |
| Unresolved logical plan | A query plan whose column/table references have not yet been resolved against the server catalog. |
| Data source | A connector abstraction that lets Spark read and possibly write a format or external system. |
| Input partition | A unit of source work that Spark can assign to one task. |
| Pushdown | Delegating filters, required columns, limits, or aggregates to a capable data source. |
| Serialization | Encoding Python objects so definitions and work can cross process boundaries. |
| Declarative pipeline | A pipeline defined in terms of desired datasets/dependencies rather than imperative execution steps. |
| Materialized view | A persisted dataset computed from a defining query and refreshed by the pipeline framework. |
| Flow | In SDP, a query definition that writes to a pipeline table or sink. |
| Dry run | Validation/planning that checks a pipeline without executing its full data refresh. |

## Spark Connect

Spark Connect separates the client application from the Spark driver. The client builds unresolved logical plans and sends them over gRPC to a server-side Spark session.

```python
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = (
    SparkSession.builder
    .remote("sc://spark-connect.example:15002")
    .appName("remote-orders-client")
    .getOrCreate()
)

spark.range(10).groupBy(F.expr("id % 2 AS bucket")).count().show()
```

The client builds a plan with values 0–9, derives even/odd bucket values, groups them, and asks the server to display counts. Python does not host the Spark driver in this architecture; it serializes the unresolved plan over gRPC. The server resolves functions, columns, catalog objects, and permissions, then executes the physical work. This separation explains why `SparkContext` and arbitrary driver/JVM access are unavailable to a Connect client.

Use Connect for remote notebooks, IDEs, application services, and stronger client/server isolation. `SparkContext` and RDD APIs are not supported, and not every classic extension crosses the protocol boundary. Check API reference labels before migrating.

Spark Connect does not provide built-in authentication by itself; deploy it behind approved authentication, authorization, TLS, and network controls.

## Python Data Source API

Introduced in Spark 4.0, the Python Data Source API lets developers implement custom readers and writers for batch and streaming. A minimal reader:

```python
from collections.abc import Iterator
from typing import Tuple
from pyspark.sql.datasource import DataSource, DataSourceReader, InputPartition

class CourseSource(DataSource):
    @classmethod
    def name(cls) -> str:
        return "course_source"

    def schema(self):
        return "id long, label string"

    def reader(self, schema):
        return CourseReader()

class CourseReader(DataSourceReader):
    def read(self, partition: InputPartition) -> Iterator[Tuple]:
        yield (1, "alpha")
        yield (2, "beta")

spark.dataSource.register(CourseSource)
spark.read.format("course_source").load().show()
```

`CourseSource.name()` registers the short format name, while `schema()` publishes the two-column contract. `reader()` creates the batch reader, and Spark calls `read` inside source tasks. The simple example yields the same two rows for every planned input partition; because it does not override partition planning, it is only a teaching connector. A production reader must divide the external source into non-overlapping partitions or deliberately declare a single partition.

Production connectors also need partition planning, options, error behavior, pushdown capabilities where supported, secret handling, rate limits, retries, serialization safety, and compatibility tests. Data source classes and methods must be pickle-serializable; executor-local imports may be necessary.

Use this API for a genuine reusable connector boundary. Do not build one merely to wrap a single REST call; external APIs often need separately controlled ingestion with explicit throttling and replay.

## Spark Declarative Pipelines (SDP)

Spark 4.2 includes Spark Declarative Pipelines for reliable batch and streaming dataset definitions:

```python
from pyspark import pipelines as dp
from pyspark.sql import DataFrame, SparkSession
import pyspark.sql.functions as F

spark: SparkSession  # injected by SDP in Spark 4.2

@dp.materialized_view(name="daily_orders")
def daily_orders() -> DataFrame:
    return (
        spark.table("raw.orders")
        .filter(F.col("status") == "COMPLETE")
        .groupBy("order_date")
        .agg(F.sum("amount").alias("revenue"))
    )
```

The decorator tells SDP that the function defines a materialized view. Spark 4.2 injects the session represented by the type-only `spark` declaration. The function returns a lazy DataFrame definition and performs no action or write. SDP can evaluate that definition during planning, infer its table dependency, and decide orchestration order; any network call or side effect inside the function could therefore run multiple times and is forbidden as a design pattern.

SDP constructs dependencies between materialized views, temporary views, streaming tables, flows, and sinks. Dataset-definition functions can be evaluated multiple times during planning. They must return DataFrames and should contain only declarative query construction—no `collect`, `count`, writes, stream `start`, or arbitrary side effects.

A pipeline project has a YAML specification with libraries, durable storage for checkpoints, and optional catalog/database/configuration. Use `spark-pipelines dry-run` in validation workflows before executing.

## Architecture comparison

| Need | Candidate |
|---|---|
| Remote thin client using DataFrame APIs | Spark Connect |
| Reusable custom format or system connector | Python Data Source API |
| Declarative dependency graph of batch/streaming datasets | Spark Declarative Pipelines |
| Simple scheduled transformation already handled by an orchestrator | Normal PySpark job may remain simpler |

## Work task: architecture decision record

An organization has remote analyst notebooks, a proprietary object store, and 40 interdependent batch/streaming tables. Write an ADR selecting or rejecting each API.

### Acceptance criteria

- Connect authentication and unsupported APIs are addressed.
- Data Source design includes partitioning, retry, and secret boundaries.
- SDP functions remain declarative and side-effect free.
- Migration, rollback, operational ownership, and local testing are included.
- “Adopt all three” is not accepted without independent justification.

References: [Spark Connect overview](https://spark.apache.org/docs/4.2.0/spark-connect-overview.html), [Python Data Source API](https://spark.apache.org/docs/4.2.0/api/python/tutorial/sql/python_data_source.html), and [Spark Declarative Pipelines](https://spark.apache.org/docs/4.2.0/declarative-pipelines-programming-guide.html).

## Exercises

Complete the [Connect, Data Source, and Declarative Pipeline exercises](../exercises/05-advanced-apis/02-connect-data-sources-and-pipelines-exercises.md).
