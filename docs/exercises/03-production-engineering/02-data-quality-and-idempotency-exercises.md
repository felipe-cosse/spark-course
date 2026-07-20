# Exercises: Data Quality and Idempotency

Source: [Data quality, idempotency, and safe reruns](../../03-production-engineering/02-data-quality-and-idempotency.md)

Estimated time: 100–140 minutes. Difficulty: intermediate to advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Data contract | Owned agreement about structure, semantics, quality, and timing. |
| Quarantine | Durable rejected-record output with evidence. |
| Idempotency | Same logical input/retry produces the same logical target state. |
| Ingestion ledger | Durable tracking of source identity and processing state. |
| Atomic publish | Exposing either a complete new result or the previous result. |

## Exercise 1: Build rule evidence

Implement reusable named rules for missing key, malformed amount, negative amount, invalid status, stale data, and duplicate key. Return all failures per row and an aggregate count by rule.

### Requirements

Null status must be explicitly classified. Valid and rejected outputs must be mutually exclusive and exhaustive.

## Exercise 2: Design a retry timeline

For a daily job, analyze failures at four points:

1. after read, before transformation;
2. after staging write;
3. after target data commit but before ledger update;
4. after ledger update but before success notification.

For each, state what a retry observes and how duplicates/partial publication are prevented.

## Exercise 3: Deterministic record key

Define and test a stable key from source system and business ID. Include nulls, separator characters, whitespace, case differences, and field-order changes. Write a versioned key specification.

## Exercise 4: Backfill plan

Create a backfill runbook for seven historical days while the daily schedule continues. Include staging, conflict policy, validation, publish, rollback, cost limit, and audit metadata.

## Self-check

- Are Spark guarantees separated from table/storage transactions?
- Can a source object delivered twice be identified reliably?
- Can validation failure expose trusted partial data?
- Does the key recipe remain stable and versioned?

## Stretch task

Design a fault-injection integration test that fails immediately before and after the target commit, then proves the retry's logical output is unchanged.
