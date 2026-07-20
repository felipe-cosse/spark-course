# Troubleshooting Decision Tree

## Key terms on this page

| Term | Definition |
|---|---|
| Symptom | The visible error or degradation, such as timeout, wrong total, or executor loss. |
| Hypothesis | A testable proposed explanation for the symptom. |
| Evidence | A measurement, plan, log, schema, or reproduction that supports or contradicts a hypothesis. |
| Diagnosis | The evidence-backed identification of the failure mechanism. |
| Mitigation | An action that reduces immediate impact or restores service. |
| Root cause | The underlying condition that allowed the failure, not merely the final error. |
| Escalation | Handing an issue to another owner with sufficient evidence and urgency context. |
| Blast radius | The systems, datasets, customers, or time periods affected by a failure/change. |
| Recovery point | The latest known position/state from which correct processing can safely resume. |
| Regression | A previously working behavior that becomes incorrect or slower after a change. |

Use this page as a narrowing process. Start with the observed category, collect the suggested evidence, and remove hypotheses that do not match. Do not apply every listed fix: one controlled change should follow one evidence-backed diagnosis, then correctness and performance must be rechecked.

## 1. Is the result wrong or the job failing?

### Wrong result

1. State input and output grains.
2. Check key uniqueness before joins.
3. Compare input = accepted + rejected.
4. Inspect null, duplicate, timezone, decimal, and late-data semantics.
5. Reduce to a tiny explicit-schema fixture that reproduces the error.
6. Inspect the optimized plan only after confirming the business contract.

### Analysis error before tasks start

Check schema, column ambiguity, types, catalog namespace, SQL syntax, function/API version, and Spark Connect support. Cluster scaling will not fix an unresolved column.

### Task/runtime failure

Go to the Spark UI stage and determine whether one task, a subset, or every task fails.

For example, one task with 50 times the median input suggests a skewed key or file. Every task failing immediately with the same analysis error suggests a shared schema/code problem. The error text may look similar at the job level, but the task distribution leads to very different next steps.

## 2. Slow stage pattern

### One/few stragglers

Likely: skewed key, large/corrupt file, external I/O variance, uneven executor, or duplicate join explosion.

Evidence: maximum versus median task input, shuffle, duration, spill, key frequencies, and executor host.

### All tasks slow with high input

Likely: insufficient pruning, too much data, expensive expression, slow storage, or too few partitions.

Evidence: scan filters, bytes read, CPU time, throughput, source latency, and partition sizes.

### Many tiny tasks

Likely: small files or excessive partition count.

Evidence: file count, scheduler delay, task duration, records/bytes per task, output writer count.

### Heavy spill/GC across tasks

Likely: partitions too large, wide aggregation/join state, caching pressure, executor sizing, or Python worker memory.

Evidence: memory/disk spill, peak execution memory, GC, executor loss, operator.

## 3. Failure signatures

### Driver out of memory

- Find `collect`, `toPandas`, large result displays, local Python lists, and oversized query plans.
- Bound the result or write distributed output.
- Increase driver memory only after removing unbounded behavior.

### Executor out of memory

- Compare failed task sizes to peers.
- Inspect skew, broadcast size, group size, partitions, cache, and Python overhead.
- Fix the data/plan pattern before treating memory as the only control.

### Fetch failure

- Check executor loss, shuffle files/service, network, disk, and upstream stage retries.
- Determine why shuffle data became unavailable.

### File not found during a job

- Check concurrent overwrites/deletes, object-store consistency assumptions, stale listings, and retention jobs.
- Refreshing metadata does not make an unsafe concurrent-write protocol safe.

### Streaming query will not restart

- Preserve the checkpoint.
- Compare code/query changes, source/sink options, state schema, shuffle/state partition count, credentials, and source retention.
- Use a tested migration/new-checkpoint plan if incompatible; do not delete state impulsively.

### Streaming backlog grows

- Compare input and processed rates.
- Inspect batch duration, state, skew, sink latency, source throttles, and executors.
- Confirm source retention headroom before experimenting.

## 4. Evidence bundle for escalation

- application and run IDs;
- environment, code artifact, parameters, and relevant Spark configuration;
- exact error class and stack trace;
- formatted/final adaptive plan;
- failing stage and task statistics;
- driver/executor logs with secrets removed;
- source manifest/data date and output publish state;
- what changed since the last successful run;
- retry/idempotency status and immediate business impact.

## 5. Changes that require extra caution

- deleting checkpoints;
- overwriting broad paths or tables;
- changing state-store/shuffle partition settings on an existing stream;
- adding a broadcast hint without measured size;
- disabling correctness/quality checks to meet an SLA;
- retrying after a non-idempotent external side effect;
- collecting “just to inspect” a production-scale result.

## Exercises

Complete the [troubleshooting decision exercises](../exercises/reference/troubleshooting-exercises.md).
