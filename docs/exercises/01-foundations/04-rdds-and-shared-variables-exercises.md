# Exercises: RDDs and Shared Variables

Source: [RDDs and shared variables](../../01-foundations/04-rdds-and-shared-variables.md)

Estimated time: 60–90 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Pair RDD | An RDD containing key/value elements. |
| Closure | A worker function plus external values it captures. |
| `reduceByKey` | Keyed aggregation with map-side combining. |
| Broadcast variable | Read-only data efficiently shared with executor tasks. |
| Accumulator | Task-updated diagnostic value readable by the driver. |

## Exercise 1: Compare keyed aggregations

Build a pair RDD of purchases and calculate spend per customer with `groupByKey` and `reduceByKey`. Verify equal results, inspect stages, and explain why their network/memory behavior differs.

## Exercise 2: Closure and broadcast review

Start with a function that captures a large Python lookup dictionary. Rewrite it using a broadcast variable, then state when a DataFrame broadcast join would be preferable.

### Deliverable

Before/after code and a short note covering serialization, executor memory, cleanup, and update behavior.

## Exercise 3: Accumulator retry reasoning

Use an accumulator to count malformed values while parsing an RDD. Explain why its value is useful for diagnostics but unsafe as an authoritative rejected-row count. Propose a DataFrame or durable-output alternative.

## Self-check

- Which operation is the action in each exercise?
- Which functions execute on workers?
- Did you bound any `collect()` call?
- Can the structured part be converted to a DataFrame earlier?

## Stretch task

Use `mapPartitions` to initialize a parser once per partition. Add safe cleanup and explain why external writes inside it would still need idempotency.
