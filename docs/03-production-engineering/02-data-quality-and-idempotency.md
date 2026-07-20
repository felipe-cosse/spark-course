# Data Quality, Idempotency, and Safe Reruns

## Key terms on this page

| Term | Definition |
|---|---|
| Data contract | An owned agreement about schema, grain, semantics, quality, timing, and compatibility. |
| Completeness | Whether all expected records or fields are present. |
| Uniqueness | Whether a key appears no more often than its contract allows. |
| Referential integrity | Whether a foreign/reference key matches a valid record in the referenced dataset. |
| Quarantine | A durable location for invalid records and their rejection evidence. |
| Fail closed | Stop trusted publication when a critical validation cannot be completed or fails. |
| Idempotency | The property that repeating the same logical operation produces the same logical target state. |
| Ingestion ledger | A durable record of source identities and their processing/publication status. |
| Atomic publish | A commit that exposes either the complete new result or the previous result, never a partial mixture. |
| Backfill | Intentional recomputation of an earlier time range or data scope. |
| Replay | Reprocessing retained source events or files, often for recovery or correction. |

## Quality begins with a contract

A useful data contract states:

- schema and nullability;
- dataset grain and key uniqueness;
- accepted values and numeric ranges;
- freshness and completeness targets;
- referential relationships;
- ownership, severity, and failure behavior.

Do not reduce quality to “row count is nonzero.” A nonempty dataset can still be duplicated, stale, incomplete, or semantically wrong.

## Express reusable checks

```python
from dataclasses import dataclass
from pyspark.sql import DataFrame, Column
import pyspark.sql.functions as F

@dataclass(frozen=True)
class Rule:
    name: str
    invalid_when: Column

def with_rule_failures(df: DataFrame, rules: list[Rule]) -> DataFrame:
    reasons = [F.when(rule.invalid_when, F.lit(rule.name)) for rule in rules]
    return df.withColumn("quality_failures", F.array_compact(F.array(*reasons)))

rules = [
    Rule("missing_order_id", F.col("order_id").isNull()),
    Rule("negative_amount", F.col("amount") < 0),
    Rule("unknown_status", ~F.col("status").isin("PENDING", "COMPLETE", "CANCELLED")),
]
```

Each `Rule` pairs a human-readable name with a distributed Boolean expression. For every row, `when` emits the name only if the condition is true; `array` collects all candidate names and `array_compact` removes the null entries. A row can therefore fail several rules without losing evidence. The function adds metadata but does not filter, count, or write, so the caller can route valid and invalid rows consistently.

Notice the SQL-null subtlety in `unknown_status`: a null status does not evaluate to a normal true/false result. Add a separate `missing_status` rule if null is invalid; otherwise the rule list gives incomplete coverage.

`array_compact` removes null entries, leaving all triggered rule names. Treat an unexpected null status explicitly; SQL three-valued logic means `~col.isin(...)` alone does not flag null.

## Measure before choosing fail or quarantine

Create aggregate metrics in one pass:

```python
evaluated = with_rule_failures(orders, rules)

quality_summary = evaluated.agg(
    F.count("*").alias("input_rows"),
    F.sum((F.size("quality_failures") > 0).cast("long")).alias("invalid_rows"),
    F.countDistinct("order_id").alias("distinct_order_ids"),
    F.max("ordered_at").alias("maximum_event_time"),
)
```

This aggregation reduces the evaluated dataset to one metrics row. It counts all input rows, counts rows with at least one failure, measures distinct order IDs, and records the newest event time. These metrics answer different questions: volume, validity, uniqueness, and freshness. An orchestration action must still materialize or write the summary before using it to make a publish decision.

Fail closed for contract violations that could corrupt trusted data. Quarantine when records can be isolated safely and the business accepts partial progress. Alert-only checks are appropriate for early-warning signals, not critical invariants.

## Idempotency

An idempotent run produces the same logical target state when repeated with the same input and run identity.

Common patterns:

- replace an explicitly selected date partition through a transactional table operation;
- upsert by a stable business key when the table provider supports atomic `MERGE`;
- write to a run-specific staging location, validate, then publish atomically;
- keep an ingestion ledger keyed by immutable source identity;
- make a streaming `foreachBatch` sink idempotent by `batch_id` or record keys.

Plain file `append` is not idempotent. Plain Parquet does not supply a transactional `MERGE` contract.

## Deterministic keys

```python
business_key = F.concat_ws(
    "\u001f",
    F.coalesce(F.col("source_system"), F.lit("<NULL>")),
    F.coalesce(F.col("order_id"), F.lit("<NULL>")),
)

with_key = orders.withColumn("record_key", F.sha2(business_key, 256))
```

`coalesce` gives nulls an explicit representation, and the unit-separator character prevents common concatenation ambiguities such as `ab` + `c` versus `a` + `bc`. `sha2` produces a fixed-width identifier. This key is deterministic only while normalization, field order, separator, and null token remain unchanged; version that recipe as part of the contract.

Document separators, null representation, normalization, and field order. A hash does not repair an unstable business key.

## Backfills and replay

A backfill should have:

- an explicit start/end scope;
- isolated staging or table versioning;
- production-like validation;
- controlled concurrency with scheduled jobs;
- a publish and rollback protocol;
- cost and runtime estimates;
- audit metadata linking output to code, config, and source versions.

## Work task: safe daily rerun

Design a daily order pipeline that may be retried after any step. Source files can arrive late for seven days and may be resent with the same path.

### Acceptance criteria

- Source identity is stable and tracked.
- Duplicate file delivery does not duplicate target rows.
- Late data changes only an intentional scope.
- Partial validation never publishes trusted output.
- Concurrent scheduled and backfill runs have a conflict policy.
- The design names which guarantees come from Spark and which come from the storage/table system.

See also [Structured Streaming fault tolerance](https://spark.apache.org/docs/4.2.0/streaming/index.html) for checkpoint-based recovery.

## Exercises

Complete the [data-quality and idempotency exercises](../exercises/03-production-engineering/02-data-quality-and-idempotency-exercises.md).
