# Exercises: Streaming Capstone Milestones

Source: [Recoverable Event Analytics capstone](../../07-capstones/02-streaming-capstone.md)

Estimated time: 12–20 hours. Difficulty: capstone.

## Key terms reinforced

| Term | Definition |
|---|---|
| Recoverability | Resuming/rebuilding correct state after failure. |
| Failure injection | Controlled creation of a fault. |
| Checkpoint lineage | Continuous recovery identity of one query. |
| Correction path | Process that fixes results outside online timing semantics. |
| Cutover | Controlled move from one query/output version to another. |

## Exercise 1: Gate 1—stream contract

Submit event envelope, payload/schema compatibility, time/lateness, duplicate, quarantine, source retention, checkpoint, and sink guarantee decisions.

## Exercise 2: Gate 2—dual test loops

Use finite DataFrames to test pure transformations. Then start a real streaming query and capture progress, checkpoint, and durable output evidence.

## Exercise 3: Gate 3—failure matrix

Execute or simulate driver termination, duplicates, late data, partial sink failure, backlog, incompatible schema, and hot key. Record detection, target state, recovery step, and reconciliation.

## Exercise 4: Gate 4—migration

Create query version 2 with one state-affecting change. Design isolated replay, dual run/new checkpoint, reconciliation, cutover, and rollback.

## Exercise 5: Gate 5—operational demo

Demonstrate stop/restart continuity, duplicate suppression, late correction, progress metrics, and one runbook drill.

## Self-check

- Does each logical query own a unique durable checkpoint?
- Are external effects idempotent under retry?
- Is source retention longer than recovery objectives?
- Does migration preserve rollback evidence?

## Stretch task

Define a state-capacity test and alert thresholds before increasing the watermark or key cardinality.
