# Operating Structured Streaming in Production

## Key terms on this page

| Term | Definition |
|---|---|
| `foreachBatch` | A sink interface that invokes custom code once for each micro-batch DataFrame. |
| Batch ID | A monotonically increasing identifier for micro-batches within one checkpoint lineage. |
| Idempotent sink | A destination protocol that produces the same logical state when a batch is retried. |
| Kafka offset | A record's ordered position inside one Kafka topic partition. |
| Source retention | How long a source preserves data for consumption or replay. |
| Backlog | Source data that exists but has not yet been successfully processed. |
| Load control | Limiting intake so processing and downstream systems stay within safe capacity. |
| Processing-time trigger | A trigger that attempts micro-batches at a configured wall-clock interval. |
| Query evolution | A code, schema, state, source, sink, or configuration change to a streaming query. |
| Dual run | Operating old and new query versions in parallel to compare outputs before cutover. |

## `foreachBatch` as a controlled boundary

`foreachBatch` runs a function for each micro-batch and supplies a monotonically increasing batch ID for a checkpoint lineage:

```python
def write_batch(batch_df, batch_id: int) -> None:
    if batch_df.isEmpty():
        return

    # Example only: implement an atomic, sink-specific upsert or batch ledger.
    (
        batch_df
        .withColumn("stream_batch_id", F.lit(batch_id))
        .write
        .mode("append")
        .parquet("/approved/staging/payment_batches")
    )

query = (
    output.writeStream
    .foreachBatch(write_batch)
    .option("checkpointLocation", "/approved/checkpoints/payments-v1")
    .start()
)
```

For each micro-batch, Spark passes a normal finite DataFrame and its batch ID to `write_batch`. `isEmpty()` avoids unnecessary sink work. The example adds the ID for traceability and appends to staging, but an append can repeat if Spark retries after a partial failure. A production version would first check or atomically commit a batch ledger, or merge stable record keys in a sink that supplies the necessary transaction.

The checkpoint option belongs to the streaming query, not the inner batch write. It records Spark progress; it cannot roll back an external side effect that occurred before the batch function raised an exception.

The shown `append` is not idempotent. A production implementation should atomically record/merge `batch_id` or stable record keys in a sink that supports the required guarantee. If a batch fails after external side effects but before its Spark commit, Spark can retry it.

## Kafka considerations

A production Kafka design defines:

- broker security and credential delivery;
- subscribed topics/patterns and consumer isolation;
- starting-offset behavior for a brand-new checkpoint;
- source retention and replay window;
- maximum records/offsets per trigger as a load-control mechanism;
- key/value schema and compatibility;
- dead-letter/quarantine behavior;
- sink idempotency and ordering requirements.

Checkpoint offsets govern recovery after a query has started. Changing a starting-offset option does not rewrite an existing checkpoint's progress.

## Triggers and backpressure

Processing-time triggers schedule micro-batches at intervals. If processing consistently takes longer than the interval, backlog grows. “Lower trigger interval” does not create capacity.

Track:

- input rows per second versus processed rows per second;
- batch duration and scheduling delay;
- source offset lag/backlog;
- state operator rows, memory, and commit time;
- event-time watermark progression;
- sink latency and throttling;
- executor failures and batch retries.

Alert on trends and sustained conditions, not one noisy batch.

Suppose a five-second trigger receives 50,000 rows but processing takes eight seconds. Spark cannot preserve five-second latency by starting unlimited overlapping work; subsequent input accumulates as backlog. First identify whether the limit is state, skew, executor capacity, or the sink. Increasing intake limits when the sink is already saturated makes recovery worse.

## Query evolution

Some changes are compatible with an existing checkpoint; others change state schema, partitioning, source, or sink semantics and need a migration. Create a versioned rollout plan:

1. classify the query change;
2. test with a copied or isolated replay dataset;
3. choose in-place resume, dual run, or new checkpoint;
4. reconcile old and new outputs;
5. switch consumers and preserve rollback evidence.

Never improvise by deleting a checkpoint in production.

## Recovery exercises

Test these before launch:

- terminate and restart the driver with the same checkpoint;
- fail a sink call after partially completing it;
- pause long enough to create source backlog;
- send duplicate and late records;
- change an upstream schema compatibly and incompatibly;
- lose access to checkpoint or target storage;
- exceed the expected state size.

## Work task: streaming runbook

Write a runbook for a payment stream whose processed rate falls below input rate for 20 minutes.

### Acceptance criteria

- It checks whether source retention is at risk.
- It distinguishes a temporary spike from lost processing capacity.
- It examines state, skew, sink latency, and executor health.
- Scaling does not bypass correctness or sink limits.
- Restart uses the same healthy checkpoint and verifies idempotent sink behavior.
- The recovery concludes with backlog and output reconciliation.

Official references: [Structured Streaming performance tips](https://spark.apache.org/docs/4.2.0/streaming/performance-tips.html) and [Kafka integration](https://spark.apache.org/docs/4.2.0/streaming/structured-streaming-kafka-integration.html).

## Exercises

Complete the [production-streaming exercises](../exercises/04-structured-streaming/03-production-streaming-exercises.md).
