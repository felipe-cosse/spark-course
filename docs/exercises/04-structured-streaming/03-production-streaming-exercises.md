# Exercises: Production Streaming Operations

Source: [Operating Structured Streaming](../../04-structured-streaming/03-production-streaming.md)

Estimated time: 120–180 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| `foreachBatch` | Custom sink function applied to each finite micro-batch. |
| Batch ID | Monotonic micro-batch identity within one checkpoint lineage. |
| Backlog | Source data not yet processed successfully. |
| Source retention | Duration source records remain available for recovery. |
| Query evolution | Change to code, state, schema, source, sink, or configuration. |

## Exercise 1: Idempotent batch protocol

Design a `foreachBatch` sink that can fail:

- before writing;
- after writing half its records;
- after target commit but before returning;
- after recording the batch ledger.

Write pseudocode for an atomic sink-specific protocol using batch ID or stable record keys. Explain which part the Spark checkpoint does not solve.

## Exercise 2: Kafka production contract

Specify topics, partitions/keys, security, schema compatibility, starting behavior, source retention, load limits, dead-letter handling, and replay for a payment stream. State which options affect only a brand-new checkpoint.

## Exercise 3: Backlog runbook

Processed rate remains below input rate for 20 minutes. Create a decision tree using batch duration, scheduling delay, state commit time, sink latency, skew, executor health, and source-retention headroom.

### Deliverable

A runbook with mitigation, safe restart, reconciliation, and escalation evidence.

## Exercise 4: Query migration

Classify changes to projection, sink path, watermark, aggregation key, state schema, and shuffle/state partition count. For each, choose in-place resume, tested migration, dual run, or new checkpoint.

## Self-check

- Can a retried batch repeat an external effect?
- Does the runbook preserve the checkpoint by default?
- Is intake limited when the sink is saturated?
- Are old/new outputs reconciled before cutover?

## Stretch task

Perform a local kill-and-restart drill with the same checkpoint and a file sink. Record output keys and query progress before and after, then explain what the experiment does and does not prove.
