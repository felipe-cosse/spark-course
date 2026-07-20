# Workplace Case: Incremental Loads and Change Data Capture

## Key terms on this page

| Term | Definition |
|---|---|
| Incremental load | Processing only data that is new or affected since a known prior point. |
| CDC | Change Data Capture: an ordered record of inserts, updates, and deletes from a source system. |
| Commit timestamp | The time a source transaction was committed; it may not be a unique ordering key. |
| Source sequence | A monotonic log position or sequence used to establish source change order. |
| Before/after image | The record values before and after a captured change. |
| Tombstone | A retained delete marker used to prevent old data from recreating a deleted entity. |
| Current-state table | A table containing only the latest applicable version of each active business key. |
| Audit history | An append-oriented history of changes used for traceability and reconstruction. |
| SCD Type 2 | A dimension model that stores multiple effective-dated versions of a business entity. |
| Effective interval | The time range during which one historical version is considered valid. |

## Problem

A source database emits CDC rows with operation (`I`, `U`, `D`), business key, source commit timestamp, sequence number, and before/after images. Build a current-state table and a full audit history.

Use a four-event story to reason about the design: insert customer A at sequence 10, update A at 12, receive a replay of 10, then delete A at 15. Audit history retains the three unique source changes. Current state applies 10, then 12, ignores the older replay, and finally removes or tombstones A at 15. If your algorithm cannot explain this small sequence, it is not ready for distributed scale.

## CDC is an ordered log, not a set of rows

Define the ordering field supplied by the source. Timestamps alone may collide or reflect different clocks. Prefer a source log sequence/offset that is total within the relevant partition. If ordering is only per source partition, define how keys are assigned to partitions.

## Contracts

| Dataset | Grain | Key |
|---|---|---|
| Raw CDC | One source log event | source partition + offset |
| Deduplicated CDC | One event | immutable event identity |
| Audit history | One version per key/change | business key + source sequence |
| Current state | One nondeleted current row per key | business key |

## Collapse a micro-batch safely

For current state, select the last event per business key within the input batch:

```python
from pyspark.sql import Window
import pyspark.sql.functions as F

latest_change = Window.partitionBy("business_key").orderBy(
    F.col("source_sequence").desc(),
    F.col("source_partition").desc(),
    F.col("source_offset").desc(),
)

collapsed = (
    changes
    .withColumn("_rank", F.row_number().over(latest_change))
    .filter(F.col("_rank") == 1)
    .drop("_rank")
)
```

The window groups changes by business key and sorts newest source order first. `row_number = 1` selects the final change for that key within this input batch. The partition and offset fields shown are only safe tie-breakers if the source defines their global precedence. After collapse, the target merge must still compare the selected sequence with the sequence already stored; otherwise a batch containing old replayed data could overwrite newer target state.

This is valid only if the order columns form the source's real precedence rule. A later-arriving event is not necessarily a later source change.

## Apply semantics

- `I`: create if absent; duplicate/replayed insert follows the source contract.
- `U`: update if its source sequence is newer than the stored sequence.
- `D`: remove from current state or mark a tombstone, while retaining the audit event.
- Replayed older changes must not overwrite newer current state.

Use a transactional table's atomic merge if it supports these predicates and concurrency requirements. For plain files, rebuild complete affected key buckets/partitions under a controlled publish protocol; do not emulate row-level transactions with ad hoc file appends.

## Slowly changing dimension type 2

If consumers need historical “as was known” values, model versions:

- `effective_from` from source ordering/business semantics;
- `effective_to` (exclusive is often simpler);
- `is_current`;
- a stable surrogate key per version;
- non-overlapping intervals per business key.

Late out-of-order changes can split an existing interval. Test interval overlap, gap policy, and same-sequence conflicts.

For example, versions effective `[July 1, July 10)` and `[July 10, infinity)` must be rewritten if a correction effective July 5 arrives: the first interval becomes `[July 1, July 5)`, the correction becomes `[July 5, July 10)`, and the July 10 version remains. Using exclusive `effective_to` boundaries avoids counting the exact transition instant in two versions.

## Deletes and retention

A tombstone may need to remain longer than source replay or table-retention windows so an old insert does not resurrect a deleted key. Regulatory deletion can conflict with audit retention; resolve this through governance and approved anonymization/deletion processes.

## Work task

Design CDC for customer profiles with at-least-once source delivery, 48-hour out-of-order events, deletes, and a need to reproduce what a downstream decision saw on any date.

### Acceptance criteria

- Source order is separate from arrival time.
- Event deduplication and current-state collapse are separate steps.
- Replayed old updates cannot replace newer state.
- Deletes have tombstone and retention semantics.
- SCD2 intervals do not overlap.
- Audit/current tables reconcile to the processed source offsets.
- Concurrent writers and partial merges have a defined storage guarantee.

## Review prompts

1. What happens when `U` arrives before its `I`?
2. How is a source reset or offset reuse detected?
3. Can the current table be rebuilt solely from retained audit history?
4. Which event timestamp answers “when did the business change” versus “when did we learn it”?

## Exercises

Complete the [incremental-load and CDC case exercises](../exercises/06-real-world-cases/02-incremental-and-cdc-exercises.md).
