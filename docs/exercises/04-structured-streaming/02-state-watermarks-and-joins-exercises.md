# Exercises: Streaming State, Watermarks, and Joins

Source: [Event time, watermarks, state, and joins](../../04-structured-streaming/02-state-watermarks-and-joins.md)

Estimated time: 110–160 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Watermark | Event-time progress estimate minus an allowed-lateness threshold. |
| State store | Persistent engine component for stateful incremental operations. |
| Late data | Records arriving behind observed event-time progress. |
| Stream-static join | Continuous input joined to a finite snapshot. |
| Stream-stream join | Two continuous inputs joined with retained matching state. |

## Exercise 1: Timeline reasoning

On paper, process events with times 10:00, 10:04, 09:50, 10:20, and 10:02 under a 10-minute watermark and five-minute windows. State when each arrives, which window it belongs to, and what assumptions are needed to know whether it contributes.

### Requirement

Do not describe the watermark as a wall-clock timeout or an unconditional guarantee for every operation.

## Exercise 2: Stateful deduplication

Create a file- or rate-derived stream with deliberate repeated event IDs. Apply `dropDuplicatesWithinWatermark` and record behavior for duplicates inside the bounded horizon. Design a downstream defense for repeats outside the retained state horizon.

## Exercise 3: Join designs

Design both:

- payments enriched with a static merchant snapshot;
- payments matched to authorizations in a bounded event-time interval.

Write join keys, watermark durations, time-range condition, output mode implications, unknown-dimension behavior, and state cleanup reasoning.

## Exercise 4: State-size estimate

Estimate state rows from 50,000 events/second, 2% unique keys per minute, a 30-minute retention horizon, and two overlapping windows. State simplifying assumptions and the measurements needed to improve the estimate.

## Self-check

- Are lateness thresholds based on observed business data?
- Is state bounded by keys and time?
- Do stream-stream joins include a time range?
- Are extremely late records given a correction path?

## Stretch task

Compare a single 3-day watermark pipeline with separate low-latency and reconciliation pipelines. Analyze latency, state cost, correctness, and operational complexity.
