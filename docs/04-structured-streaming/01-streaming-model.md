# Structured Streaming: The Incremental Table Model

## Key terms on this page

| Term | Definition |
|---|---|
| Unbounded table | A conceptual table that can continually receive new rows and therefore has no final size. |
| Micro-batch | A small finite batch of newly available streaming data processed as one incremental step. |
| Streaming query | A continuously managed execution of a DataFrame plan against streaming input. |
| Source | The system or format from which a streaming query receives new records. |
| Sink | The destination to which a streaming query commits results. |
| Trigger | The policy that determines when Spark attempts the next incremental processing step. |
| Output mode | The rule describing which result rows a streaming query emits after a trigger. |
| Checkpoint | Durable query progress and state metadata used to recover a streaming query. |
| Query progress | Runtime information about offsets, rates, duration, state, and event-time progress. |
| Delivery semantics | The conditions under which records or effects may occur once, at least once, or exactly once end to end. |

## Mental model

Structured Streaming treats an input stream as an unbounded table. You describe a DataFrame query; Spark runs it incrementally as new records arrive. The default engine uses micro-batches.

The legacy DStream-based Spark Streaming API is not the focus of new development. Use Structured Streaming unless maintaining an older system requires otherwise.

## First local stream

The built-in rate source is ideal for deterministic learning:

```python
import pyspark.sql.functions as F

events = (
    spark.readStream
    .format("rate")
    .option("rowsPerSecond", 5)
    .load()
    .select(
        F.concat(F.lit("event-"), F.col("value")).alias("event_id"),
        F.col("timestamp").alias("event_time"),
        (F.col("value") % 10).cast("string").alias("customer_id"),
        F.col("value"),
    )
)

```

The rate source produces two columns: an increasing `value` and its generation `timestamp`. The projection turns each value into a stable teaching event ID, renames the timestamp as business event time, creates ten repeating customer IDs, and keeps the numeric value. This describes an unbounded DataFrame: Spark cannot call ordinary batch actions on it because more rows may always arrive.

The next block attaches a development sink and starts execution:

```python

query = (
    events.writeStream
    .format("console")
    .outputMode("append")
    .option("truncate", False)
    .trigger(processingTime="5 seconds")
    .start()
)

query.awaitTermination(30)
query.stop()
```

`writeStream` converts the streaming plan into an executable query definition. Append mode asks Spark to emit new rows, the console sink prints them, and the five-second trigger groups available input into micro-batches. `start()` returns immediately with a `StreamingQuery`; `awaitTermination(30)` keeps the driver alive for at most 30 seconds, and `stop()` performs an orderly shutdown. Production lifecycle code should also capture query exceptions and final progress.

The console sink is for development. Production output needs a durable sink, checkpoint, and explicit delivery/idempotency design.

## Sources and sinks

Common sources include files, Kafka, socket (testing), rate (testing), and provider-specific connectors. Common sinks include files, Kafka, tables, and `foreachBatch`.

Validate source and sink guarantees. Spark's checkpointed engine cannot make a non-idempotent external side effect exactly once by itself.

## Output modes

- **append** emits only final new rows that will not change under the query semantics;
- **update** emits rows changed since the last trigger;
- **complete** emits the entire result table after each trigger.

Supported modes depend on operations and sink. A stateful aggregation without a watermark may never consider a group final for append mode.

## Checkpoints

A checkpoint preserves query progress and, for stateful queries, state metadata. It is part of the production state of the application.

```python
query = (
    transformed.writeStream
    .format("parquet")
    .option("path", "s3a://bucket/curated/events")
    .option("checkpointLocation", "s3a://bucket/checkpoints/events-v1")
    .outputMode("append")
    .start()
)
```

Here `path` holds business output while `checkpointLocation` holds query recovery metadata. They have different ownership and retention requirements. After a restart with the same logical query and checkpoint, Spark resumes from recorded progress instead of applying the starting-offset behavior of a brand-new query. Deleting the checkpoint would create a new recovery identity, not merely “clear a cache.”

Use a unique, durable, access-controlled checkpoint per logical query. Do not point two active queries at one checkpoint. Do not delete a checkpoint as routine troubleshooting; doing so discards recovery information and may cause replay or data loss depending on source retention and sink behavior.

## Batch and streaming reuse

Pure transformations built from supported DataFrame expressions can often be applied to static and streaming DataFrames:

```python
def normalize_events(df):
    return df.select(
        F.trim("event_id").alias("event_id"),
        F.to_timestamp("event_time").alias("event_time"),
        F.col("amount").cast("decimal(18,2)").alias("amount"),
    )
```

The function contains only supported column expressions and returns a DataFrame, so it can be tested against a finite batch fixture and applied to streaming input. It does not call `count`, `collect`, or `write`, which would incorrectly assume a final dataset or hide query lifecycle inside business logic.

Actions such as `count()` or `collect()` cannot be embedded as if a streaming DataFrame were finite.

## Work task: stream contract

Design an event stream with event ID, event time, ingestion time, schema version, source, customer ID, and payload. Define parsing failures, duplicates, ordering, late records, checkpoint ownership, and sink guarantee.

### Acceptance criteria

- Event time and processing/ingestion time are not conflated.
- Recovery after driver failure is explained.
- Source retention exceeds the planned recovery window.
- “Exactly once” is qualified by source, engine, and sink behavior.
- A schema-evolution policy exists.

Official guide: [Structured Streaming](https://spark.apache.org/docs/4.2.0/streaming/index.html).

## Exercises

Complete the [Structured Streaming model exercises](../exercises/04-structured-streaming/01-streaming-model-exercises.md).
