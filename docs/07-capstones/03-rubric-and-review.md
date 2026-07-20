# Capstone Rubric and Engineering Review

## Key terms on this page

| Term | Definition |
|---|---|
| Rubric | A scoring guide that describes observable levels of quality across several dimensions. |
| Criterion | One specific condition or dimension used to evaluate work. |
| Evidence | A reproducible artifact or observation supporting a claim about system behavior. |
| Finding | A review statement that links evidence to a concrete risk or gap. |
| Severity | The expected urgency/impact level of a finding. |
| Risk | The possible correctness, reliability, security, cost, or operational harm. |
| Recommendation | A proposed change intended to reduce the stated risk. |
| Verification | A test or observation that demonstrates the recommendation actually closed the finding. |
| Known limitation | An explicitly documented behavior or constraint not currently solved. |
| Reviewer | A person evaluating artifacts and evidence independently of the implementer. |

Score each dimension from 0 to 4. A production-ready course pass requires at least 24/32, with no zero in correctness, recoverability, or security/governance.

Score from evidence, not polish. A confident presentation without retry proof does not earn recoverability points; a plain report with a recorded kill/restart/reconciliation test does. When performance or platform facilities are unavailable locally, assess the quality of the experiment design and clearly mark which claims remain unverified.

| Dimension | 0 | 2 | 4 |
|---|---|---|---|
| Contracts & grain | Unstated | Basic schemas/grains | Versioned contracts, cardinality, time/money/null semantics |
| Correctness | Unreconciled | Happy path tested | Edge cases, invariants, deterministic behavior, full reconciliation |
| Code design & tests | Monolithic | Some functions/tests | Pure logic, explicit schemas, unit/integration layers, useful fixtures |
| Performance | Guesswork | Plan captured | Evidence-led tuning, representative comparison, skew/file strategy |
| Recoverability | Unsafe retry | Basic rerun | Idempotent publish/sink, partial failure, replay/backfill, rollback tested |
| Observability | Print statements | Counts and status | SLO metrics, lineage/run IDs, actionable alerts and logs |
| Security & governance | Ignored | Credentials avoided | Least privilege, classification, audit, retention, protected logs/checkpoints |
| Communication & operations | Code only | Basic README | ADRs, runbook, demo, limitations, ownership, incident clarity |

## Review checklist

### Data and correctness

- What is the grain at each boundary?
- Which keys are unique, and where is uniqueness validated?
- How are null, invalid, duplicate, late, and deleted records handled?
- Are decimal, rounding, timezone, and calendar rules explicit?
- Can totals and counts reconcile across each boundary?

### Execution and performance

- Where are actions, exchanges, sorts, and Python boundaries?
- Which dimensions may broadcast, based on measured size?
- How do partition count and file layout match the workload?
- What happens with a hot key or 10x daily volume?
- Is caching limited to measured reuse?

### Failure and operations

- What if the driver stops before or after the sink commits?
- Can the same input/run execute twice safely?
- How does a backfill interact with the scheduled job?
- What is the recovery point if source data expires?
- Which alert wakes a human, and what should they do first?

### Security and ownership

- Which workload identity reads/writes each location?
- Could logs, UIs, metrics, quarantine, or checkpoints expose sensitive data?
- Who owns schema changes, source incidents, target correctness, and retention?
- Which guarantees are Apache Spark's and which belong to the table format/platform?

## Evidence bundle

A reviewer should receive:

- architecture diagram and source-to-target map;
- contracts and ADRs;
- code and tests with commands/results;
- sample run metrics and reconciliation;
- physical plan and performance experiment;
- recovery demonstration evidence;
- deployment configuration with secrets removed;
- runbook and known limitations.

## Feedback format

Use findings rather than vague approval:

```text
Severity: high | medium | low
Evidence: file/query/plan/metric
Risk: correctness, reliability, cost, security, or operability impact
Recommendation: smallest verifiable change
Verification: test or runtime evidence that closes the finding
```

Example: “High severity; physical plan and duplicate-key query show the customer dimension is many-to-many, causing finance rows to multiply. Enforce one current dimension row per key before joining, and verify source versus output amount reconciliation.” This is actionable because it contains evidence, impact, a bounded change, and a closure test.

## Exercises

Complete the [rubric calibration and engineering-review exercises](../exercises/07-capstones/03-rubric-and-review-exercises.md).
