# Event Time, Watermarks, State, and Streaming Joins

## Key terms on this page

| Term | Definition |
|---|---|
| Event time | The timestamp when the business event actually occurred. |
| Ingestion time | The timestamp when the data platform first received the event. |
| Processing time | The timestamp when Spark processes the event. |
| Late data | Events that arrive after newer event times have already been observed. |
| Watermark | Spark's event-time progress estimate minus an allowed-lateness threshold. |
| State | Information retained across micro-batches for windows, deduplication, joins, or custom logic. |
| State store | The engine component that persists and versions streaming state. |
| Event-time window | A fixed or sliding interval that groups events by their business timestamps. |
| Stateful deduplication | Remembering event identities for a bounded time so redeliveries can be removed. |
| Stream-static join | A join between continuously arriving rows and a finite DataFrame snapshot. |
| Stream-stream join | A join in which both sides continue receiving records and require matching state. |

## Event time versus processing time

- **Event time** is when the business event happened.
- **Ingestion time** is when the platform received it.
- **Processing time** is when a streaming trigger processes it.

Late data is normal: mobile devices reconnect, brokers retry, and upstream systems backfill. Design latency and completeness as a trade-off.

## Watermarked window aggregation

```python
import pyspark.sql.functions as F

per_minute = (
    events
    .withWatermark("event_time", "15 minutes")
    .groupBy(
        F.window("event_time", "5 minutes"),
        "merchant_id",
    )
    .agg(
        F.count("*").alias("payments"),
        F.sum("amount").alias("amount"),
    )
)
```

The watermark says the query is designed around events arriving no more than 15 minutes behind observed event-time progress. The five-minute `window` assigns each event to a time interval, and grouping by merchant keeps independent totals per interval and merchant. Because results may change while late events still qualify, output-mode behavior must match when the engine can consider a window final.

Do not read “15 minutes” as a processing timeout. If input stops, event-time progress may also stop. The watermark concerns data timestamps and supported state cleanup, not wall-clock deletion of every record after 15 minutes.

A watermark is the engine's estimate of how far event time has progressed, less an allowed lateness threshold. For relevant stateful operations, it lets Spark eventually evict old state and finalize append-mode results. It is not a promise that every record younger than the threshold is accepted or that every older record is always dropped in every query shape; read the operation-specific semantics.

## Stateful deduplication

If the source can redeliver event IDs, deduplicate with an event-time bound:

```python
deduplicated = (
    events
    .withWatermark("event_time", "1 day")
    .dropDuplicatesWithinWatermark(["event_id"])
)
```

Spark keeps recently seen `event_id` values in state. A redelivered ID inside the watermark-governed horizon is removed. Eventually old identities can leave state so it remains bounded; a duplicate arriving after that horizon may pass through and must be covered by downstream keys or reconciliation if the business requires longer protection.

The event ID must be stable across retries. The watermark duration must reflect real lateness and source replay behavior. Without a bound, deduplication state can grow indefinitely.

## Stream-static join

Enriching a stream with a static dimension is common:

```python
enriched = payments.join(
    F.broadcast(merchant_dimension),
    "merchant_id",
    "left",
)
```

Every new payment is matched against the finite merchant snapshot. Broadcasting avoids shuffling the large stream only if the dimension is safely small. The left join preserves unknown merchants so they can be measured or handled explicitly. If merchant risk changes while the query runs, define whether restarting or refreshing the snapshot is acceptable or whether an event-time versioned dimension is required.

The static DataFrame represents a snapshot for the query execution. If dimensions change, define refresh or temporal-join semantics rather than assuming they update invisibly.

## Stream-stream join

Stream-stream joins need time constraints so old state can be removed:

```python
p = payments.withWatermark("payment_time", "20 minutes").alias("p")
a = authorizations.withWatermark("authorization_time", "20 minutes").alias("a")

matched = p.join(
    a,
    F.expr("""
        p.card_id = a.card_id AND
        a.authorization_time BETWEEN p.payment_time - INTERVAL 5 MINUTES
                                 AND p.payment_time + INTERVAL 10 MINUTES
    """),
    "inner",
)
```

The equality condition limits candidates to the same card. The time range allows an authorization from five minutes before through ten minutes after the payment. Watermarks on both streams plus this bounded relationship give Spark evidence for when old unmatched state can be discarded. Without time constraints, either stream might still deliver a matching row indefinitely, causing unbounded state.

Watermarks and event-time range conditions jointly allow state cleanup. Outer joins add timing subtleties because unmatched results cannot be emitted until the engine can decide a match will not arrive.

## State sizing

State grows with key cardinality, event rate, lateness bound, window overlap, and stored value size. Monitor state rows, memory, commit time, and checkpoint growth. A business request for “accept events up to 90 days late” has a real compute and storage cost.

## Work task: late payment policy

Payments normally arrive within 2 minutes, 99.9% within 30 minutes, but an offline channel can arrive three days late. Fraud alerts need 5-minute latency; finance needs complete daily totals.

Design one or more pipelines and explain watermark, state, late-data route, replay, and correction strategy.

### Acceptance criteria

- Fraud latency and finance completeness are not forced into one unsuitable state policy.
- Extremely late events have a durable correction path.
- State-growth implications are estimated.
- Duplicate and out-of-order behavior is explicit.
- Join time bounds are based on business timing, not arbitrary syntax.

References: [Structured Streaming APIs](https://spark.apache.org/docs/4.2.0/streaming/apis-on-dataframes-and-datasets.html) and [additional information](https://spark.apache.org/docs/4.2.0/streaming/additional-information.html).

## Exercises

Complete the [state, watermark, and streaming-join exercises](../exercises/04-structured-streaming/02-state-watermarks-and-joins-exercises.md).
