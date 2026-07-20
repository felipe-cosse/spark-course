# Storage, File Layout, and Semi-structured Data

## Key terms on this page

| Term | Definition |
|---|---|
| File format | The encoding and organization used to store records, such as Parquet, JSON, or CSV. |
| Columnar format | A format that stores values by column, enabling selective reads and effective analytical compression. |
| Row-oriented format | A format that stores each record's fields together, often suitable for event interchange. |
| Storage partition | A directory or table-layout division based on column values, used to skip irrelevant data. |
| Partition pruning | Avoiding reads of storage partitions that cannot satisfy a filter. |
| Execution partition | A logical chunk of work processed by one Spark task; it is not the same as a storage partition. |
| Small-file problem | Planning, listing, and scheduling overhead caused by very many tiny files. |
| Schema evolution | Controlled change of a stored dataset's fields or types over time. |
| Transactional table | A table/provider that coordinates atomic commits and, depending on capability, updates or merges. |
| Idempotency | The property that repeating the same logical write does not change the final logical result. |

## Choose formats based on the workload

| Format | Strength | Typical use |
|---|---|---|
| Parquet | Columnar, typed, compressed, supports pruning | Default analytical interchange and tables |
| ORC | Columnar with strong ecosystem support | Common in Hive-oriented platforms |
| JSON | Flexible and human-readable | Raw events and interchange, not efficient analytics |
| CSV | Ubiquitous but weakly typed | External exchange and ingestion boundary |
| Avro | Row-oriented schema evolution and messaging fit | Event payloads and row-heavy interchange |

Table formats and managed platforms add transactional behavior beyond plain files. Do not claim ACID updates, `MERGE`, or concurrent-write safety from Parquet alone.

## Read with contracts and options

```python
orders = (
    spark.read
    .schema("order_id string, customer_id string, ordered_at timestamp, amount decimal(18,2)")
    .parquet("s3a://approved-bucket/curated/orders/")
)
```

The explicit schema prevents Spark from inferring types from a sample. The `s3a` path tells the Hadoop-compatible connector where to read; it does not itself prove credentials, encryption, or consistency behavior. Because only four columns are requested by the schema, a downstream `select` and filter can often let Parquet avoid reading unrelated column pages.

For CSV and JSON, record parsing mode, timezone, encoding, multiline behavior, and malformed-record handling. Production readers should not depend on sampling-based schema inference.

## Partition pruning

Storage partitioning creates directory keys such as `order_date=2026-07-20/`. Choose low-to-moderate-cardinality columns that match frequent filters.

```python
(
    output
    .write
    .mode("append")
    .partitionBy("order_date")
    .parquet("/tmp/pyspark-course/orders")
)

one_day = spark.read.parquet("/tmp/pyspark-course/orders").filter(
    F.col("order_date") == F.lit("2026-07-20").cast("date")
)
```

The write creates directories organized by `order_date`; tasks write files inside those directories. On the read, the date predicate can be translated into a partition filter so unrelated date directories are not scanned. Confirm pruning in `explain(mode="formatted")`; simply having a partitioned layout does not help if the filter wraps the partition column in an expression Spark cannot use.

Partitioning by `order_id` would create an excessive number of directories. Partitioning a tiny dataset can create overhead without benefit.

## File sizing

Many tiny input files create listing, planning, and task-scheduling overhead. A few huge, unsplittable files reduce parallelism. Output file count is influenced by DataFrame partitions at write time.

- `coalesce(n)` can reduce partitions without a full shuffle, but may create imbalance.
- `repartition(n, columns...)` reshuffles and can distribute writes by a key.
- `maxRecordsPerFile` can cap records, but bytes per row vary.

Select target sizes using measurements from the storage system and query workload. “128 MB everywhere” is a heuristic, not a contract.

## Schema evolution

Adding nullable columns is usually easier than changing meaning or type. Renaming a field may appear as delete-plus-add to readers that identify columns by name. Maintain a compatibility policy and test old and new records together.

## Parse nested JSON once

```python
event_schema = "event_id string, event_time timestamp, attributes map<string,string>, items array<struct<sku:string,qty:int,price:decimal(18,2)>>"

events = raw.select(
    F.from_json("value", event_schema).alias("event"),
    "source_file",
).select("event.*", "source_file")
```

The first projection parses each payload once into the declared nested schema and keeps source lineage. The second expands the struct's fields into top-level columns. A malformed payload produces a null parsed struct under permissive behavior, so the next quality step must classify it; otherwise the compact syntax can hide rejected input.

Repeated `get_json_object` calls hide the contract and repeat parsing work. Preserve the raw payload or its durable pointer for replay and investigation.

## Write modes are not idempotency

- `append` repeats rows on a rerun unless the design prevents it.
- `overwrite` can remove more data than intended if scope is wrong.
- `ignore` and `errorifexists` concern path existence, not record correctness.

Idempotency requires a run-key, partition-replacement protocol, transactional table operation, or another sink-specific strategy.

## Work task: file-layout design

Design storage for five years of orders, queried mostly by date range and occasionally by region. Daily volume varies from 10 GB to 600 GB.

Deliver a one-page decision covering format, schema ownership, partition columns, expected file-size range, compaction, backfill behavior, late records, and concurrent writers.

### Acceptance criteria

- High-cardinality identifiers are not storage partition columns.
- Small-file prevention and repair are both addressed.
- Reruns and partial failures have a safe protocol.
- Transactional assumptions identify the actual table/storage capability.

Reference: [Spark SQL data sources](https://spark.apache.org/docs/4.2.0/sql-data-sources.html) and [Parquet data source](https://spark.apache.org/docs/4.2.0/sql-data-sources-parquet.html).

## Exercises

Complete the [storage and semi-structured-data exercises](../exercises/02-dataframes-sql/04-storage-and-semi-structured-data-exercises.md).
