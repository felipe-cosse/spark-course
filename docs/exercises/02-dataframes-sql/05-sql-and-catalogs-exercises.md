# Exercises: SQL, Tables, Views, and Catalogs

Source: [SQL, tables, views, and catalogs](../../02-dataframes-sql/05-sql-and-catalogs.md)

Estimated time: 90–120 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Logical plan | Relational operations requested before strategy selection. |
| Physical plan | Concrete operators selected to execute a query. |
| Catalog | Organization and metadata interface for tables, views, and namespaces. |
| Parameter marker | SQL placeholder whose value is supplied separately. |
| CTE | A named query block introduced by `WITH`. |

## Exercise 1: Translate between APIs

Implement a daily completed-order summary once with DataFrame expressions and once with SQL. Compare schemas, output, optimized plan, and physical plan.

### Deliverable

Both implementations plus an evidence-backed conclusion about whether syntax changed execution.

## Exercise 2: Grain-driven CTEs

Write a monthly customer mart using CTEs for completed orders, customer-month totals, refund totals, and month-over-month change. Add a comment above each CTE stating its grain.

### Hint

Generate a month spine if missing months must appear; `lag` alone only sees rows that exist.

## Exercise 3: Safe parameterization

Create a query accepting start timestamp and status through value parameters. Then design an allowlist mapping for user-selected table and aggregation identifiers. Explain why identifier text is not handled like a value parameter.

## Exercise 4: Catalog investigation

In your available catalog, inspect tables and run `DESCRIBE EXTENDED` on one object. Record provider, location, type, schema, statistics availability, and which behaviors cannot be inferred from local mode.

## Self-check

- Does every CTE have a clear grain?
- Are values separated from SQL text?
- Are estimates distinguished from runtime metrics?
- Did you avoid claiming managed/external lifecycle without verifying the provider?

## Stretch task

Create stale or absent-statistics reasoning for a join. Propose the evidence required before adding a broadcast or join-strategy hint.
