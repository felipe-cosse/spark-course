# SQL, Tables, Views, and Catalogs

## Key terms on this page

| Term | Definition |
|---|---|
| Spark SQL | Spark's structured-data engine and its SQL language interface. |
| Logical plan | A representation of requested relational operations before a physical execution strategy is selected. |
| Physical plan | The concrete operators and data movements Spark selects to execute a logical plan. |
| Catalyst | Spark SQL's analysis and optimization framework. |
| Temporary view | A session-scoped SQL name backed by a DataFrame plan. |
| Catalog | A service or interface that organizes tables, views, functions, and namespaces. |
| Managed table | A table whose catalog/provider normally manages both metadata and data lifecycle. |
| External table | A table whose metadata points to data with a separately managed lifecycle. |
| Parameter marker | A SQL placeholder whose value is supplied separately from query text. |
| CTE | Common table expression: a named query block introduced with `WITH`. |
| Statistics | Estimated row counts, sizes, and distributions used by the optimizer. |

## One engine, two expression styles

DataFrame operations and Spark SQL produce logical plans for the same optimizer. Use SQL when a declarative query is clearest, DataFrames when programmatic composition and Python testing are clearer, and combine them at named boundaries.

```python
orders.createOrReplaceTempView("orders_stage")

daily = spark.sql("""
    SELECT
        CAST(ordered_at AS DATE) AS order_date,
        COUNT(*) AS completed_orders,
        CAST(SUM(amount) AS DECIMAL(20, 2)) AS revenue
    FROM orders_stage
    WHERE status = 'COMPLETE'
    GROUP BY CAST(ordered_at AS DATE)
""")
```

The temporary view exposes the existing `orders` plan to SQL. The query filters first, converts timestamps to dates, groups by that date, and returns one row per date with count and decimal revenue. No action appears yet: `spark.sql` returns another lazy DataFrame. You can write an equivalent DataFrame expression and compare optimized plans to see that syntax choice and execution strategy are separate concerns.

## Parameterize values safely

Do not build SQL by interpolating untrusted strings. Spark supports parameter markers through `SparkSession.sql` arguments:

```python
result = spark.sql(
    "SELECT * FROM orders_stage WHERE ordered_at >= :start_at AND status = :status",
    args={"start_at": "2026-07-01", "status": "COMPLETE"},
)
```

The SQL string contains named placeholders, while the actual date and status travel in `args`. This keeps quotation and value encoding out of manual string construction. It does not parameterize table or column identifiers; if users can choose those, map their input to a controlled allowlist of known catalog names.

Identifiers such as table names require separate validation because they are not ordinary values. Prefer an allowlist of known catalog objects.

## Views and tables

- A local temporary view belongs to one session.
- A global temporary view belongs to the reserved global temp database for the Spark application.
- A persistent table is registered in a catalog and has provider/storage semantics.
- A managed table's lifecycle may include its data; an external table normally points at separately managed storage. Exact behavior depends on catalog and provider.

```python
spark.catalog.listTables()
spark.sql("DESCRIBE EXTENDED analytics.daily_orders").show(truncate=False)
```

Do not derive production assumptions from a local session catalog. Confirm the deployed catalog, warehouse, permissions, table provider, and namespace behavior.

## SQL correctness patterns

Use common table expressions to name grains:

```sql
WITH completed_orders AS (
  SELECT order_id, customer_id, CAST(ordered_at AS DATE) AS order_date, amount
  FROM orders
  WHERE status = 'COMPLETE'
),
customer_day AS (
  SELECT order_date, customer_id, SUM(amount) AS customer_revenue
  FROM completed_orders
  GROUP BY order_date, customer_id
)
SELECT order_date,
       COUNT(*) AS active_customers,
       SUM(customer_revenue) AS revenue
FROM customer_day
GROUP BY order_date
```

Read the CTEs as a sequence of grains. `completed_orders` remains one row per completed order. `customer_day` then becomes one row per date and customer. The final query counts those customer-day rows and sums their revenue, producing one row per date. Naming intermediate grains makes it easier to detect an accidental duplicate-producing join or an aggregation at the wrong level.

Here `customer_day` is one row per date and customer; the final query is one row per date.

## Inspect plans and statistics

```python
daily.explain(mode="cost")
spark.sql("DESCRIBE EXTENDED analytics.orders").show(truncate=False)
```

Cost mode displays estimates used during planning; `DESCRIBE EXTENDED` helps determine what metadata and statistics the catalog knows. Estimates are not runtime measurements. Compare them with the final adaptive plan and stage metrics when diagnosing a strategy choice.

Statistics can help Spark choose join strategies. Stale or missing statistics can produce a surprising plan. Do not add hints until you know what the optimizer estimated and what happened at runtime.

## Work task: analytics mart query

Create a query with one row per customer and month containing order count, revenue, refund amount, last order timestamp, and month-over-month revenue change.

### Acceptance criteria

- Each common table expression has a stated grain.
- Status definitions are centralized rather than repeated inconsistently.
- Month boundaries and timezone are explicit.
- The lag calculation is deterministic and handles missing months deliberately.
- The physical plan is attached with one observation about exchanges or sorts.

Reference: [Spark SQL reference](https://spark.apache.org/docs/4.2.0/sql-ref.html) and [SQL getting started](https://spark.apache.org/docs/4.2.0/sql-getting-started.html).

## Exercises

Complete the [SQL, table, view, and catalog exercises](../exercises/02-dataframes-sql/05-sql-and-catalogs-exercises.md).
