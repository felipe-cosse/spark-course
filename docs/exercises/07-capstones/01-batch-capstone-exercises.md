# Exercises: Batch Capstone Milestones

Source: [Reliable Commerce Data Platform capstone](../../07-capstones/01-batch-capstone.md)

Estimated time: 12–20 hours. Difficulty: capstone.

## Key terms reinforced

| Term | Definition |
|---|---|
| Vertical slice | Small end-to-end implementation across all architecture layers. |
| Evidence bundle | Artifacts collectively proving correctness and operability. |
| ADR | Record of an architecture decision and consequences. |
| Fault injection | Deliberately causing failure to test recovery. |
| Performance budget | Explicit runtime/resource/cost target. |

## Exercise 1: Gate 1—contract review

Submit source-to-target map, schemas, grains, key/cardinality rules, time/money semantics, quality thresholds, classification, SLOs, and ownership. A reviewer must approve this gate before broad implementation.

## Exercise 2: Gate 2—correctness slice

Implement one-day accepted, rejected, current-order, customer, and finance outputs with unit tests and complete count/money reconciliation.

## Exercise 3: Gate 3—recovery

Demonstrate exact rerun, late correction, failure before publish, and failure after target commit. Record logical target state and ledger state after every step.

## Exercise 4: Gate 4—performance

Inject skew and small files, record baseline, apply one evidence-led change, and prove output equivalence plus performance effect.

## Exercise 5: Gate 5—operational handoff

Give another learner only deployment configuration, dashboard/metrics, and runbook. Ask them to diagnose an injected problem and record gaps in your documentation.

## Self-check

- Does each gate produce reviewable evidence?
- Can every output row trace back to source identity/code version?
- Are publish/retry guarantees supplied by named capabilities?
- Are known limitations explicit?

## Stretch task

Prepare and record the 15-minute demo. Remove any step that asserts behavior without showing evidence.
