# Aggregations and Window Functions

## Key terms on this page

| Term | Definition |
|---|---|
| Aggregation | A calculation that combines multiple input rows into summary values. |
| Grouping key | A column or expression whose equal values define which rows are aggregated together. |
| Conditional aggregation | An aggregation whose contribution depends on a row-level condition. |
| Window function | A calculation over related rows that retains one output row for each input row. |
| Window partition | The subset of rows that a window treats as one independent group. |
| Window order | The deterministic sequence of rows inside each window partition. |
| Window frame | The range of rows or ordering values visible to a window calculation for the current row. |
| `lag` | A window function that returns a value from a preceding row in the defined order. |
| Approximate aggregation | A bounded-error summary designed to use fewer resources than an exact calculation. |
| Pivot | An operation that converts distinct row values into output columns. |

## Scenario

Finance wants daily revenue, Product wants seven-day active customers, and Support wants each customer's previous order. These outputs have different grains even when they begin with the same order table.

## Grouped aggregation changes grain

```python
import pyspark.sql.functions as F

daily = (
    orders
    .filter(F.col("status") == "COMPLETE")
    .groupBy(F.to_date("ordered_at").alias("order_date"))
    .agg(
        F.count("order_id").alias("orders"),
        F.countDistinct("customer_id").alias("customers"),
        F.sum("amount").cast("decimal(20,2)").alias("revenue"),
        F.avg("amount").cast("decimal(20,2)").alias("average_order_value"),
    )
)
```

Trace the grain change. The filter first keeps only completed orders. `groupBy` assigns those rows to calendar-date groups, and `agg` collapses each group to one row. `count("order_id")` counts non-null IDs, `countDistinct` counts unique non-null customers, and `sum`/`avg` operate on non-null amounts. The casts make the money output contract explicit after Spark widens decimal types during aggregation.

`count("amount")` ignores null amounts; `count("*")` counts rows. `sum` returns null for a group with only null values. Decide whether null means unknown, zero, or invalid before using `coalesce`.

## Conditional aggregation

Build several related metrics in one grouping:

```python
by_day = orders.groupBy("order_date").agg(
    F.sum(F.when(F.col("status") == "COMPLETE", 1).otherwise(0)).alias("complete_orders"),
    F.sum(F.when(F.col("status") == "CANCELLED", 1).otherwise(0)).alias("cancelled_orders"),
    F.sum(F.when(F.col("status") == "COMPLETE", F.col("amount"))).alias("revenue"),
)
```

All three metrics use the same input scan and grouping. Each `when` produces a per-row contribution: 1 or 0 for the counts, and amount or null for revenue. Because `sum` ignores nulls, non-complete orders do not add money. If a date contains no complete non-null amounts, its revenue can remain null; decide whether that means unknown or should become an explicit zero.

The predicate belongs in the metric definition. A global filter would remove cancelled rows needed by the second metric.

## Window functions preserve row grain

```python
from pyspark.sql import Window

customer_timeline = Window.partitionBy("customer_id").orderBy("ordered_at", "order_id")

sequenced = orders.select(
    "*",
    F.row_number().over(customer_timeline).alias("order_number"),
    F.lag("ordered_at").over(customer_timeline).alias("previous_ordered_at"),
    F.sum("amount").over(
        customer_timeline.rowsBetween(Window.unboundedPreceding, Window.currentRow)
    ).alias("lifetime_value_to_date"),
)
```

Unlike `groupBy`, this window keeps every order row. The partition restarts calculations for each customer, while timestamp and order ID define a stable order. `row_number` labels sequence, `lag` looks one row backward, and the cumulative `sum` uses every row from the customer's beginning through the current row. Remove `rowsBetween(...)` and Spark's default frame may not express the intended cumulative row behavior, especially when ordering values tie.

The order specification should be deterministic. If timestamps can tie, include a stable secondary key.

## Rows versus ranges

- `rowsBetween` defines a frame by physical row positions in the window order.
- `rangeBetween` defines a frame by values of the ordering expression.

For calendar windows, pre-aggregate to the desired time grain or use an appropriate numeric/timestamp ordering expression with carefully defined range units. A “last seven rows” window is not a “last seven days” window.

## Approximate aggregations

Exact distinct counts can be expensive. `approx_count_distinct` trades bounded estimation error for lower cost. Approximate percentiles are often appropriate for latency metrics. The choice must appear in the metric contract, not as a hidden optimization.

```python
summary = events.agg(
    F.approx_count_distinct("user_id", rsd=0.02).alias("estimated_users"),
    F.percentile_approx("latency_ms", [0.5, 0.95, 0.99], 10_000).alias("latency_percentiles"),
)
```

`approx_count_distinct` returns an estimate whose relative standard deviation target is 2%. `percentile_approx` asks for the median, 95th, and 99th percentile in one array; its accuracy parameter controls the accuracy/memory trade-off. These outputs are suitable only if downstream readers know they are approximate.

## Pivot caution

Pivoting an unbounded or high-cardinality field creates a wide schema and can stress planning and execution. Supply an explicit bounded list when a pivot is genuinely the target format:

```python
statuses = ["COMPLETE", "CANCELLED", "PENDING"]
wide = orders.groupBy("order_date").pivot("status", statuses).count()
```

## Work task: customer value features

Build one row per completed order with:

- the customer's sequence number;
- days since the previous completed order;
- cumulative completed spend;
- share of the customer's final lifetime spend;
- the customer's first and most recent order timestamps.

### Acceptance criteria

- Tied timestamps produce deterministic results.
- Null amounts have documented semantics.
- Windows preserve order grain.
- The final lifetime value is calculated without a driver-side loop.
- Division safely handles zero or null denominators.

Reference: [Window API](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.sql/window.html).

## Exercises

Complete the [aggregation and window exercises](../exercises/02-dataframes-sql/02-aggregations-and-windows-exercises.md).
