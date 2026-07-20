# Workplace Case: The 3 A.M. Performance Incident

## Key terms on this page

| Term | Definition |
|---|---|
| SLA | Service-level agreement: a formal commitment for availability, completion, or response. |
| Straggler | A task that finishes much later than peers and delays the whole stage. |
| Skew | Uneven data distribution that gives a small number of tasks disproportionate work. |
| Median task duration | The middle task duration, useful as a robust comparison with the slowest task. |
| Hot key | A key whose frequency is dramatically higher than most keys. |
| Sentinel key | A placeholder such as `UNKNOWN` used in place of missing or invalid real keys. |
| Salting | Adding a secondary key component to split one hot key across partitions. |
| Two-phase aggregation | Partial aggregation by `(key, salt)` followed by final aggregation by the original key. |
| Mitigation | A change that restores service or reduces immediate impact. |
| Root cause | The underlying condition that made the incident possible, beyond the visible symptom. |

## Incident

The daily customer metrics job normally finishes in 28 minutes. Today it has run for 70 minutes. The latest stage has 2,000 tasks: 1,999 finish within 20 seconds, while one task runs for more than 35 minutes and spills heavily. Input volume rose only 8%.

The key teaching signal is the distribution, not the average. Uniform resource shortage would normally slow many tasks; one extreme task points toward one partition, key, file, or executor. Compare maximum to median task duration and bytes before scaling the whole cluster.

## Initial hypothesis

The task distribution points to skew, not uniform under-capacity. The input increase alone does not explain one extreme task. Preserve the application, plan, stage metrics, and logs before changing configuration.

## Triage sequence

1. Verify the job/run identity, data date, code version, config, and source manifests.
2. Check whether the job can be safely stopped and retried without partial duplicate output.
3. In the SQL/stage view, map the long task to an operator and exchange.
4. Compare its input/shuffle bytes, records, spill, GC, and locality to median tasks.
5. Identify the partitioning/join/grouping key.
6. Measure top key frequencies and null/sentinel shares from a bounded diagnostic aggregation.
7. Check join cardinality and dimension uniqueness before treating this only as performance.

## Likely causes

- a new sentinel such as `customer_id = 'UNKNOWN'` owns a huge fraction of rows;
- a null key was coalesced to one value before grouping;
- a dimension lost uniqueness and multiplied one key;
- an organic large customer became a hot key;
- AQE skew handling is disabled, inapplicable, or its thresholds do not split this partition;
- a single compressed or corrupt input file creates an uneven scan.

## Mitigation ladder

Choose the smallest safe change supported by evidence:

1. Quarantine or separately handle invalid sentinel/null keys if they violate the contract.
2. Restore dimension uniqueness if the join is multiplying rows incorrectly.
3. Split a known heavy business key into a separate path and union the correctly aggregated result.
4. Broadcast the other join side only if its measured size is safe.
5. Validate AQE skew configuration and final plan.
6. Salt a legitimate heavy key as a controlled algorithmic change, with tests and a two-phase aggregation.
7. Increase parallelism/resources only when partition sizing—not one key—is the actual constraint.

More executor memory is weak first aid for a single indefinitely growing partition. It may increase cost and delay the same failure.

## Salting sketch

For a heavy join key, add a deterministic salt to the large side and duplicate only matching heavy-key rows on a demonstrably small side. For aggregation, aggregate by `(key, salt)` and then aggregate partial results by `key`. Validate non-additive metrics such as distinct counts separately.

Suppose `UNKNOWN` owns 100 million rows and you use 20 salt values. A deterministic row hash can spread those rows into about 20 partial groups, each producing a partial sum. The second aggregation adds the 20 partial sums back to one `UNKNOWN` total. This works for additive sums and counts; simply summing partial distinct-customer counts can double-count customers appearing in several salts. Salting therefore changes an algorithm and needs correctness tests, not just a configuration change.

## Recovery and verification

- Run the chosen fix on the affected data plus a normal baseline date.
- Compare row counts, key uniqueness, and financial/metric totals.
- Compare maximum/median task duration, spill, shuffle bytes, total runtime, and cost.
- Publish only after output reconciliation.
- Record the trigger, why existing alerts missed it, and a prevention action.

## Learner task

Write an incident update for executives and a separate technical remediation note.

### Acceptance criteria

- The executive update states impact, current state, mitigation, and next update time without unsupported certainty.
- The technical note links skew evidence to the physical operator.
- Cardinality correctness is checked.
- The proposed fix handles legitimate and invalid hot keys differently.
- The output and performance comparisons are reproducible.
- A new alert tracks task-duration skew or hot-key share before the SLA is missed.

## Exercises

Complete the [performance-incident exercises](../exercises/06-real-world-cases/04-performance-incident-exercises.md).
