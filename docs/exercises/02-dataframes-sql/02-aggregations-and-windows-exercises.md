# Exercises: Aggregations and Windows

Source: [Aggregations and window functions](../../02-dataframes-sql/02-aggregations-and-windows.md)

Estimated time: 90–120 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Aggregation | Combining rows into group-level summaries. |
| Window partition | Rows treated as one group by a window. |
| Window frame | The subset visible to the current row's calculation. |
| Conditional aggregation | A summary whose contribution depends on a predicate. |
| Approximate percentile | A resource-efficient estimate of a distribution position. |

## Exercise 1: Metric semantics

Create orders with null IDs, customers, and amounts. Calculate `count(*)`, `count(order_id)`, `countDistinct(customer_id)`, `sum(amount)`, and `avg(amount)` by date. Explain every difference.

## Exercise 2: Customer timeline

Return one row per completed order with:

- order sequence;
- previous order timestamp;
- days since previous order;
- cumulative spend;
- final lifetime spend;
- current share of final lifetime spend.

Use a deterministic window order. Safely handle null/zero totals.

### Deliverable

Code, an explicit expected fixture, and a paragraph distinguishing grouped aggregation from window behavior.

### Hint

You may need one ordered window for cumulative metrics and one full-partition frame for final totals.

## Exercise 3: Exact versus approximate

Generate or create latency data. Compare exact distinct count with `approx_count_distinct`, and exact/sorted reasoning with `percentile_approx`. Record error, plan, and runtime on your local scale without claiming the small test generalizes to production.

## Self-check

- Is each output grain stated?
- Does the ordering include a stable tie-breaker?
- Is “last seven rows” distinguished from “last seven days”?
- Are approximate outputs labeled in the contract?

## Stretch task

Create a bounded status pivot with an explicit value list. Add an unexpected status and show why it should be measured separately rather than silently widening the schema.
