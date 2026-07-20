# Exercises: Incremental Loads and CDC Case

Source: [Incremental loads and CDC](../../06-real-world-cases/02-incremental-and-cdc.md)

Estimated time: 3–5 hours. Difficulty: advanced workplace case.

## Key terms reinforced

| Term | Definition |
|---|---|
| CDC | Ordered capture of source inserts, updates, and deletes. |
| Source sequence | Source-defined change ordering position. |
| Tombstone | Retained marker representing a deletion. |
| SCD Type 2 | Effective-dated historical dimension versions. |
| Current state | Latest nondeleted applicable row per business key. |

## Exercise 1: Event-order table

For insert at sequence 10, update at 12, replay at 10, delete at 15, late update at 11, and a new insert at 20, write expected audit and current state after each arrival. Separate arrival order from source order.

## Exercise 2: Collapse and apply

Implement deterministic micro-batch collapse per key, then design an apply predicate that prevents an older sequence from overwriting a newer target. Test tied timestamps and different source partitions.

## Exercise 3: SCD2 intervals

Build effective-dated history for changes on July 1 and July 10, then insert a correction effective July 5. Verify intervals are exclusive, non-overlapping, and have exactly one current version.

## Exercise 4: Delete policy

Define tombstone, replay horizon, audit retention, regulatory deletion, and rebuild behavior. Explain how an old replay is prevented from resurrecting a deleted customer.

## Self-check

- Is immutable event deduplication separate from current-state collapse?
- Does source sequence outrank arrival time?
- Can audit history rebuild current state?
- Are interval overlap/gap policies tested?

## Stretch task

Design a source-reset detector for offset reuse or lost log continuity and an operational response that prevents silent corruption.
