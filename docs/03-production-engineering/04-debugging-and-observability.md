# Debugging and Observability

## Key terms on this page

| Term | Definition |
|---|---|
| Observability | The ability to infer internal system state from metrics, logs, traces, plans, and other evidence. |
| Metric | A numeric measurement tracked over time, such as batch duration or rejected-row count. |
| Log | A timestamped event record containing diagnostic or audit context. |
| Stack trace | The chain of function/method calls active when an exception occurred. |
| Error class | A structured, stable category for a Spark error, more useful than matching free-form text. |
| Spark UI | Spark's web interface for jobs, stages, SQL, executors, storage, and environment details. |
| Straggler | A task that takes substantially longer than its peers in the same stage. |
| Spill | Execution data written to disk because it could not remain in memory. |
| Fetch failure | Failure to retrieve shuffle output produced by an earlier task/stage. |
| Runbook | A tested operational procedure for diagnosing and responding to a known incident class. |

## Diagnose by layer

| Layer | Typical evidence |
|---|---|
| Contract/correctness | rejected rows, key counts, schema diff, reconciliation |
| Query plan | parsed/analyzed/optimized/physical plan |
| Tasks and stages | Spark UI duration, shuffle, spill, retries, skew |
| Python workers | Python exception, UDF profile/logs, serialization error |
| JVM/executors | executor logs, GC, container exit, OOM reason |
| Storage/network | throttling, request latency, missing files, permission errors |
| Orchestration | parameters, retries, timeout, dependency and publish state |

Start with the earliest failing layer. An executor OOM may be caused by a join-contract error that multiplied rows.

## Spark UI workflow

1. On **Jobs**, identify the failing or slow action.
2. On **Stages**, compare task durations, input, shuffle read/write, spill, and retries.
3. In **SQL**, connect the query plan to stages and operators.
4. On **Executors**, inspect loss, memory, task failures, and uneven work.
5. Read driver and executor logs with the stage/task context.

A single task much slower than peers suggests skew, a bad file, external I/O variance, or heterogeneous executors. All tasks spilling suggests sizing or plan pressure across the stage.

## Structured PySpark errors

Spark exposes structured error information for many exceptions:

```python
from pyspark.errors import PySparkException

try:
    spark.sql("SELECT missing_column FROM orders").show()
except PySparkException as exc:
    print({
        "error_class": exc.getCondition(),
        "sql_state": exc.getSqlState(),
        "message": str(exc),
    })
    raise
```

The `try` block intentionally requests a missing column. The handler extracts machine-friendly classification and SQL state, adds the readable message, and then re-raises the original exception. Re-raising matters: logging should enrich failure evidence, not convert a failed job into apparent success. In a real logger, attach application/run IDs and remove data or secrets before emitting context.

APIs can evolve; consult the 4.2 reference for the exception type in use. Preserve the original exception and stack trace rather than replacing it with a vague “job failed.”

## Observable jobs

At minimum, log or emit:

- application ID, job/run ID, code version, environment, and parameters;
- source identities and target identity;
- input, accepted, rejected, and output counts where cost-appropriate;
- freshness/event-time bounds;
- duplicate, null, and referential-integrity metrics;
- duration and status of read, transform, quality, and write phases;
- checkpoint or batch IDs for streaming;
- error class and retry decision.

Avoid collecting high-cardinality values into logs. Sample invalid data under access controls; it may contain personal or financial information.

## Common failures

Read the following subsections as hypotheses, not one-to-one diagnoses. “Out of memory” tells you which process exceeded a boundary, but the cause may be a data-contract explosion, skew, caching, a broadcast, or an unbounded collection. Always connect the message to the failing operator and task distribution.

### Driver out of memory

Look for `collect`, `toPandas`, large local collections, very large plans, or excessive metadata. More driver memory can mask but not correct an unbounded collection.

### Executor out of memory

Inspect skew, large per-key state, broadcast size, partition size, caching, Python worker memory, and GC/spill. Identify whether one task or all tasks fail.

### Fetch failure

Check executor loss, shuffle service/storage health, network issues, and upstream stage instability. Repeated blind retries may reproduce the same root cause.

### Analysis exception

Inspect schema, ambiguous/missing columns, catalog/database selection, types, and function signatures before looking at cluster resources.

## Work task: incident runbook

Write a runbook for “daily orders job exceeded its 60-minute SLA.” Include queries/screens, decision branches, immediate mitigation, safe retry checks, escalation information, and evidence to preserve for the postmortem.

### Acceptance criteria

- It separates correctness, plan, resource, and external-system causes.
- It never recommends deleting checkpoints or production data as a first step.
- Retry safety is checked before rerunning.
- It includes both restoration and root-cause follow-up.

Official references: [Monitoring](https://spark.apache.org/docs/4.2.0/monitoring.html), [PySpark user guide debugging chapter](https://spark.apache.org/docs/4.2.0/api/python/user_guide/bugbusting.html), and [PySpark errors](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.errors.html).

## Exercises

Complete the [debugging and observability exercises](../exercises/03-production-engineering/04-debugging-and-observability-exercises.md).
