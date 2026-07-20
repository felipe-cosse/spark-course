# Exercises: Structured Streaming Model

Source: [Structured Streaming model](../../04-structured-streaming/01-streaming-model.md)

Estimated time: 90–130 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Unbounded table | A table-like stream that can continue receiving rows. |
| Micro-batch | A finite increment of streaming input processed together. |
| Output mode | Rule for which result rows are emitted per trigger. |
| Checkpoint | Durable progress/state metadata for recovery. |
| Delivery semantics | Conditions governing duplicates, loss, and commit behavior end to end. |

## Exercise 1: Classify streaming operations

For `select`, `filter`, `groupBy`, `count`, `collect`, `writeStream`, and `foreachBatch`, explain whether each can be used directly on unbounded input and under what form. Distinguish `groupBy().count()` from a batch action.

## Exercise 2: Rate-source query

Build a rate-source stream that creates event ID, event time, one of five account IDs, and decimal amount. Filter, normalize, and write to the console for 30 seconds.

### Deliverable

Code plus at least two `lastProgress` observations identifying input rate, processed rate, batch duration, and source position.

## Exercise 3: Output-mode reasoning

For raw append-only events, windowed counts with watermark, and unbounded global counts, choose append, update, or complete mode and explain sink compatibility and when rows can be considered final.

## Exercise 4: Checkpoint ownership

Design checkpoint paths and retention for accepted events, rejected events, and five-minute metrics. Explain why each query needs a unique checkpoint and what happens if it is lost.

## Self-check

- Are event time and processing time distinct?
- Did you identify `start()` as query lifecycle initiation?
- Is the console sink treated as development-only?
- Are end-to-end guarantees qualified by sink behavior?

## Stretch task

Test a pure normalization function against both a finite DataFrame and streaming input. Explain which testing evidence comes from each mode.
