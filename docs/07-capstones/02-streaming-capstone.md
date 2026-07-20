# Capstone B: Recoverable Event Analytics

## Key terms on this page

| Term | Definition |
|---|---|
| Recoverability | The ability to resume or rebuild correct state after a failure. |
| Event envelope | Standard event metadata containing identity, time, source, and schema version. |
| Durable sink | A destination that preserves committed output beyond one query process. |
| Checkpoint lineage | The continuous recovery identity formed by a query and its checkpoint history. |
| Replay | Reprocessing retained events to restore, compare, or correct output. |
| Correction path | A separate controlled process that updates results missed by the online timing policy. |
| Watermark | An event-time progress mechanism that helps bound supported stateful operations. |
| Schema compatibility | Whether readers and writers can safely operate across an event-schema change. |
| Cutover | The controlled point at which consumers move from an old system/query to a new one. |
| Failure injection | Deliberately causing a fault to verify detection and recovery behavior. |

## Mission

Build a Structured Streaming application that consumes versioned commerce events, emits near-real-time operational metrics, archives accepted events, and supports replay and correction without duplicate durable output.

Use the rate or file source locally. Describe Kafka configuration and security for production rather than requiring a broker for course completion.

Build this capstone in two loops. The correctness loop uses finite DataFrames to test parsing, validation, deduplication, and window expressions. The lifecycle loop runs an actual streaming query, stops/restarts it, and observes checkpoint/sink behavior. Keeping these loops separate makes failures easier to understand.

## Required features

- Explicit event envelope and payload schema.
- Invalid-schema quarantine with durable raw evidence.
- Event-time watermark and stable event-ID deduplication.
- A windowed aggregation with a documented output mode.
- One stream-static enrichment with a dimension-refresh strategy.
- Durable checkpoint ownership and access policy.
- Idempotent sink protocol for alerts or metrics.
- Late-event correction path separate from the low-latency result.
- Metrics for source lag, processed rate, batch duration, state, watermark, duplicates, late events, sink retries, and output reconciliation.

## Failure experiments

Demonstrate and document:

1. driver termination followed by resume from the same checkpoint;
2. duplicate source events;
3. events inside and outside the lateness policy;
4. sink failure after a partial external effect;
5. backlog where input rate exceeds processed rate;
6. incompatible schema version;
7. a hot key that stresses state or aggregation.

## Architecture decisions

Write short records for:

- watermark duration and evidence;
- trigger interval and capacity assumption;
- source retention and maximum recovery time;
- checkpoint version/migration strategy;
- output guarantee across source, Spark, and sink;
- alert or result idempotency key;
- state-store sizing and growth alert;
- sensitive-data handling;
- replay and correction ownership.

## Suggested local skeleton

```python
source = (
    spark.readStream
    .format("rate")
    .option("rowsPerSecond", 50)
    .load()
)

events = build_course_events(source)       # deterministic fixture generation
accepted, rejected = validate_events(events)
deduplicated = deduplicate_events(accepted)
metrics = build_window_metrics(deduplicated)

# Start separate durable queries with unique checkpoints.
```

The skeleton intentionally keeps transformations separate from query startup. `source` is unbounded, but `build_course_events`, `validate_events`, `deduplicate_events`, and `build_window_metrics` should each return plans with no hidden actions. The entry point then starts distinct accepted, rejected, and metrics queries with unique checkpoints. If two outputs need one atomic commit, redesign the sink boundary rather than assuming independent queries commit together.

Do not start multiple output queries in hidden transformation functions. The entry point owns lifecycle, termination, errors, and coordinated observability.

## Demo script

1. Start the query and show progress metrics.
2. Introduce duplicates and late events.
3. Kill and restart from the same checkpoint.
4. Prove durable output contains no logical duplicates.
5. Show the correction path for records outside the online watermark.
6. Present one incident drill using the runbook.

For the restart proof, capture the last committed output key and query progress, stop the process, restart with the same checkpoint, and demonstrate continuity plus absence of logical duplicates. Merely showing that the process starts again does not prove correct recovery.

Use the [capstone rubric](03-rubric-and-review.md) for review.

## Exercises

Use the [streaming-capstone milestone exercises](../exercises/07-capstones/02-streaming-capstone-exercises.md) to implement and review each delivery gate.
