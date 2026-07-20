# Exercises: Real-time Payment Risk Case

Source: [Real-time payment risk](../../06-real-world-cases/03-streaming-fraud-design.md)

Estimated time: 3–5 hours. Difficulty: advanced system design.

## Key terms reinforced

| Term | Definition |
|---|---|
| Velocity feature | Recent-window count, sum, or distinct measure. |
| Event envelope | Standard identity, time, source, and schema metadata. |
| Idempotency key | Stable identifier used to suppress repeated logical effects. |
| Fail open/closed | Continue or block when a control is unavailable. |
| Trust boundary | Crossing between components with different security assumptions. |

## Exercise 1: Event journey

Create one payment event and trace it through parse, quarantine decision, deduplication, enrichment, velocity state, scoring, durable alert, notification, and archive. At each boundary, state input/output contract, possible failure, and retry effect.

## Exercise 2: State and watermark design

Using an observed lateness distribution, choose online watermark/window policies for 1- and 5-minute features. Estimate state and define a separate late correction/reconciliation path.

## Exercise 3: Idempotent alert protocol

Define an alert key from model/rule version, tokenized subject, condition, and window. Design durable commit followed by notification. Analyze a timeout after commit.

## Exercise 4: Failure drill

Choose two: corrupt model artifact, hot merchant, incompatible schema, stale dimension, sink timeout, or Kafka backlog. Write detection metrics, immediate decision, recovery, reconciliation, and post-incident prevention.

## Self-check

- Is sensitive card data tokenized and absent from logs?
- Are state and late behavior bounded?
- Can replay create duplicate notifications?
- Does model failure have an owned fail-open/closed choice?

## Stretch task

Compare embedded Spark ML scoring, vectorized Python scoring, and an external model service against latency, batching, dependency, retry, and scaling requirements.
