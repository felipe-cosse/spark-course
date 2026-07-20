# Exercises: Production Orders ETL Case

Source: [Production Orders ETL](../../06-real-world-cases/01-orders-batch-etl.md)

Estimated time: 3–5 hours. Difficulty: advanced workplace case.

## Key terms reinforced

| Term | Definition |
|---|---|
| ETL | Extract, transform, and load process. |
| Current state | Latest applicable version of each order. |
| Source manifest | Immutable inventory of inputs included in a run. |
| Reconciliation | Proof that records and measures balance across outputs. |
| Publish protocol | Validated, controlled exposure of new output. |

## Exercise 1: Contract package

Write contracts for raw events, accepted events, quarantine, current orders, and daily finance. Include grain, key, schema, nulls, timestamp/timezone, decimal/rounding, valid transitions, lateness, ownership, and SLO.

## Exercise 2: Vertical slice

Create fixtures and pure transformations for:

- a pending order corrected to complete with a new amount;
- a duplicate event delivery;
- malformed JSON;
- an unknown currency;
- two updates tied on timestamp.

Prove the current output and finance summary contain the intended logical values once.

## Exercise 3: Reconciliation suite

Calculate input, parsed, valid, rejected, unique-event, current-order, dimension-match, and finance totals. Define which equations must equal exactly and which metrics are thresholds.

## Exercise 4: Recovery design

Describe state and retry behavior for failure after staging, after validation, during target commit, and after commit before ledger success. Include concurrent backfill behavior.

## Self-check

- Are event history and current state modeled separately?
- Does late arrival change only intended business scope?
- Are money and dimension effective dates correct?
- Can partial output become trusted?

## Stretch task

Capture a formatted plan for the main join/aggregation, define a 45-minute performance budget, and propose one experiment without inventing unsupported production measurements.
