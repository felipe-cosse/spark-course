# Capstone A: Reliable Commerce Data Platform

## Key terms on this page

| Term | Definition |
|---|---|
| Capstone | A final integrative project completed with less step-by-step guidance than a normal lesson. |
| Synthetic fixture | Deliberately constructed test data that represents important normal and edge cases. |
| Source-to-target map | A field- and rule-level description of how inputs become outputs. |
| Current state | The latest applicable version of each business entity. |
| Run ledger | Durable metadata recording input identity, run status, code/configuration, and publication. |
| Reconciliation | Evidence that counts and measures balance across processing boundaries. |
| Integration test | A test that exercises a real format, catalog, connector, or publish boundary. |
| Performance budget | An explicit limit or target for runtime, data movement, resources, or cost. |
| ADR | Architecture Decision Record: a short document recording a decision, context, alternatives, and consequences. |
| Demo | A planned, evidence-based presentation that proves system behavior rather than only describing it. |

## Mission

Build a production-minded batch pipeline that turns raw commerce data into trusted order, customer, and daily finance outputs. The capstone is provider-neutral: use local Parquet for learning, but identify where production requires a transactional table/catalog capability.

Do not begin by implementing every output. Start with one “vertical slice”: one valid event enters, one current order is selected, one finance row is produced, and reconciliation closes. Add invalid, duplicate, late, and failed-publish cases one at a time. This creates a working feedback loop and makes each new guarantee visible.

## Inputs

- order events in nested JSON;
- order items in CSV;
- customer snapshots in Parquet;
- daily currency rates;
- a source manifest containing immutable file identity and ingestion metadata.

Create small synthetic fixtures that include malformed JSON, missing keys, duplicate events, out-of-order corrections, late events, decimal edge cases, duplicated dimension rows, unknown currency, and daylight-saving boundaries.

## Outputs

1. **Accepted order events** — typed, deduplicated event grain.
2. **Order-event quarantine** — raw evidence and reason array.
3. **Current orders** — one deterministic row per order.
4. **Customer 360** — one row per customer with agreed metrics.
5. **Daily finance** — one row per business date and settlement currency.
6. **Run ledger and metrics** — input identity, code/config version, counts, reconciliation, status, and durations.

## Functional requirements

- Explicit schemas and UTC timestamp processing.
- Decimal-safe money and documented rounding.
- Deterministic duplicate/update precedence.
- Many-to-one join validation.
- Incremental affected-scope processing and seven-day late corrections.
- Safe rerun after failure at read, transform, validation, or publish.
- Reconciliation from source to accepted/quarantine to curated/mart.
- Data retention/classification and least-privilege access design.

## Engineering requirements

- Pure DataFrame transformations separated from I/O.
- Unit tests using `assertDataFrameEqual` and `assertSchemaEqual`.
- At least one integration test of real file read/write behavior.
- A formatted physical plan and a performance hypothesis.
- Metrics for quality, freshness, duplicates, dimensions, output files, and runtime.
- A deployment manifest or `spark-submit` command with no embedded secrets.
- Runbook for slow job, bad source schema, and failed publish.
- Architecture decision record for storage/table format and partitioning.

## Milestones

### 1. Contract review

Deliver grains, schemas, business rules, SLOs, data classification, and failure policy before implementation.

### 2. Correctness slice

Process one day end to end with unit tests and reconciliations.

A useful one-day fixture has only enough rows to prove distinct behaviors: two updates for one order, one rejected event, one unmatched optional dimension, and two currencies. Write expected row counts and money totals before execution so the reconciliation is a test rather than a post-hoc explanation.

### 3. Incremental/recovery slice

Replay the same manifest, inject a late correction, and fail immediately before publish. Demonstrate stable logical output.

### 4. Performance slice

Generate skew and many small input files. Capture the baseline, apply one evidence-led change, and compare.

Keep correctness fixtures unchanged during the performance experiment. A faster plan that drops late rows, changes decimal behavior, or multiplies a join is not an optimization. Report both runtime metrics and equality/reconciliation evidence.

### 5. Operational review

Another learner uses only the runbook to diagnose an injected failure.

## Demo script

Your final 15-minute demo should show:

1. contract and architecture;
2. one raw valid and one invalid record through the lineage;
3. tests;
4. first run and exact rerun;
5. late correction;
6. plan/UI evidence;
7. alert/runbook and rollback path;
8. known limitations and next decision.

Use the [capstone rubric](03-rubric-and-review.md) for review.

## Exercises

Use the [batch-capstone milestone exercises](../exercises/07-capstones/01-batch-capstone-exercises.md) to implement and review each delivery gate.
