# Workplace Case: Real-time Payment Risk

## Key terms on this page

| Term | Definition |
|---|---|
| Risk score | A numeric estimate used to rank or classify the likelihood/cost of suspicious behavior. |
| Velocity feature | A count, sum, or distinct measure over a recent time window. |
| Event envelope | Standard metadata around a payload, such as ID, timestamp, source, and schema version. |
| Tokenization | Replacing sensitive data with a non-sensitive reference token. |
| Idempotency key | A stable identifier used by a sink to recognize repeated logical writes. |
| Alert sink | A durable destination that records alerts before notifications or review workflows. |
| Fail open | Continue an operation when a control/model is unavailable, accepting additional risk. |
| Fail closed | Block or hold an operation when a control/model is unavailable. |
| Review capacity | The number of alerts human or automated reviewers can handle in a period. |
| Trust boundary | A point where data or control crosses between components with different security assumptions. |

## Brief

Score payment events and emit review alerts within 30 seconds. Detect unusually high payment velocity per card and merchant, enrich with merchant risk, handle broker replay, and provide a correction path for late events.

This is a system-design exercise, not a claim that a simple rule is a complete fraud model.

Learn from this case by following one payment end to end. Give it an ID, event time, card token, merchant, and amount. At each arrow in the proposed flow, write what new guarantee or field is added, what failure can occur, and whether a retry repeats an effect. This produces a design you can operate, not only an architecture diagram.

## Proposed flow

```text
Kafka payments
  -> parse/version validation
  -> quarantine malformed payloads
  -> watermark + event-ID deduplication
  -> static/temporal enrichment
  -> 5-minute velocity state
  -> rules/model scoring
  -> idempotent alerts sink
  -> durable accepted-event archive
```

The parse step turns bytes into a versioned typed record; quarantine preserves bytes that cannot satisfy that contract. Deduplication removes broker/source replays within the online time policy. Enrichment attaches merchant context, state computes recent behavior, and scoring produces a decision. The alert is committed durably before a separate notification system contacts reviewers. Finally, archiving accepted events creates a replay source independent of short online state.

The durable archive supports replay, investigations, training, and finance correction independently of the low-latency alert state.

## Event contract

- immutable `event_id` and stable source partition/offset;
- `event_time` with defined UTC semantics;
- card token rather than raw sensitive card data;
- merchant and account identifiers;
- amount and currency as decimal/ISO code;
- schema version;
- trace/correlation ID;
- payload classification and retention.

## State and time decisions

Suppose 99.99% of online payments arrive within five minutes. A 20-minute watermark can bound alert state, while a separate reconciliation pipeline processes later arrivals. The threshold is an SLO/cost decision and must be validated from real lateness distributions.

Velocity features might include:

- count and sum by card over 1 and 5 minutes;
- distinct merchants or countries;
- time since previous accepted payment;
- merchant-level rate deviation.

High-cardinality keys and hot merchants require explicit state and skew testing.

## Idempotent alerts

Create a deterministic alert key from rule/model version, subject, window, and condition. The sink must upsert or reject duplicates atomically. External notifications should be downstream of the durable alert record so a Spark retry does not send duplicate messages without control.

For example, a card-window velocity alert might key on `rule-v3`, the card token, and the five-minute window start. Reprocessing the same events generates the same alert key, so the sink updates or ignores the existing record. A genuinely new model version or time window creates a distinct, auditable alert.

## Model serving choices

- Spark ML pipeline embedded in the stream: reproducible and batch-friendly, but validate latency and model refresh.
- Vectorized Python scoring: may work for suitable models; account for worker startup, model loading, memory, and Arrow batches.
- External service: independent scaling and model stack, but introduces network latency, rate limits, retries, and side-effect semantics.

Do not issue one remote request per row from a Python UDF.

## Operational SLOs

- end-to-end alert latency p50/p95/p99;
- source backlog and processed/input rates;
- invalid, duplicate, and late-event rates;
- state size and commit duration;
- scoring failures/timeouts;
- alerts per rule/model version and review capacity;
- precision/recall after labels mature;
- sink error and duplicate-suppression counts.

## Failure drills

1. Kafka backlog approaches retention.
2. Merchant dimension is stale or unavailable.
3. Alert sink commits then times out.
4. Model artifact is corrupt on some executors.
5. One merchant becomes 40% of traffic.
6. A schema producer deploys an incompatible payload.

## Learner deliverables

- architecture and trust-boundary diagram;
- event and alert contracts;
- Structured Streaming query skeleton;
- state-size estimate;
- idempotent sink protocol;
- late-data reconciliation design;
- incident runbook for one drill.

## Acceptance criteria

- Latency and completeness use separate paths where appropriate.
- No raw sensitive credential/card data is logged or used as a partition key.
- Replay does not create duplicate durable alerts.
- State is bounded by event-time policy.
- Model failure has a documented fail-open/fail-closed decision.
- Every external side effect has retry semantics.

## Exercises

Complete the [real-time payment-risk exercises](../exercises/06-real-world-cases/03-streaming-fraud-design-exercises.md).
