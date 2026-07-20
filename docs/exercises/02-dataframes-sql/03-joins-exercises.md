# Exercises: Joins, Grain, and Skew

Source: [Joins, grain, and skew](../../02-dataframes-sql/03-joins.md)

Estimated time: 100–135 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Cardinality | Expected match multiplicity between join keys. |
| Semi join | Keep left rows with a match, without right columns. |
| Anti join | Keep left rows without a match. |
| Broadcast join | Copy a small side to executors to avoid shuffling the large side. |
| Skew | Uneven key frequency that creates disproportionate partitions. |

## Exercise 1: Write the contract first

For orders joined with customers, products, currency rates, and promotions, write a join contract for each pair: grains, keys, expected cardinality, null behavior, unmatched behavior, and output grain.

## Exercise 2: Expose a correctness failure

Create a customer dimension with a duplicated key. Left-join it to orders and show how row count and revenue change. Add a pre-join uniqueness check that stops trusted processing.

### Deliverable

Fixture, faulty result, corrected validation, and a reconciliation proving the valid join preserves order grain and amount.

## Exercise 3: Reconciliation with join types

Compare source and warehouse orders using anti joins for source-only/target-only and a matched comparison for changed amount/status. Preserve enough evidence to investigate differences.

## Exercise 4: Skew experiment

Create data where one key holds at least 50% of rows. Compare the plan/task behavior of a normal join, a safely broadcast dimension join, and separate processing of the hot invalid key. Do not force scale large enough to harm your machine.

### Hint

Use `explain` and partition/key-frequency measurements; local runtime alone may not expose cluster skew clearly.

## Self-check

- Did you validate cardinality before tuning?
- Are null keys treated as a business rule rather than automatically equal?
- Is the broadcast side measured and bounded?
- Does reconciliation cover counts and monetary measures?

## Stretch task

Design a salting approach for a legitimate hot key. Explain how the other side is expanded and how you recombine additive results without corrupting distinct metrics.
