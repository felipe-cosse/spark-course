# Joins, Grain, and Data Skew

## Key terms on this page

| Term | Definition |
|---|---|
| Join | An operation that combines rows from two datasets according to a matching condition. |
| Join key | The column or columns used to determine whether rows match. |
| Cardinality | The expected number of matches between keys, such as many-to-one or many-to-many. |
| Inner join | A join that retains only matching rows from both sides. |
| Left join | A join that retains every left row and adds matching right values when present. |
| Semi join | A join that keeps left rows having a match without adding right-side columns. |
| Anti join | A join that keeps left rows having no match. |
| Null-safe equality | Equality semantics under which two null values compare as equal. |
| Broadcast join | A strategy that sends a small side to executors to avoid shuffling the large side. |
| Skew | Uneven key distribution that causes a few partitions/tasks to process disproportionate data. |
| Alias | A temporary name used to qualify a DataFrame and prevent ambiguous column references. |

## Start with a join contract

Before writing code, record:

| Question | Example answer |
|---|---|
| Left grain | One row per order |
| Right grain | One row per customer |
| Join keys | `customer_id` |
| Expected output grain | One row per order |
| Null-key behavior | Keep order; customer attributes null |
| Unmatched behavior | Metric and quarantine after threshold |
| Cardinality | Many orders to one customer |

If the right side contains duplicate customer keys, a left join multiplies order rows. This is a correctness issue before it is a performance issue.

## Clear aliases and conditions

```python
import pyspark.sql.functions as F

o = orders.alias("o")
c = customers.alias("c")

enriched = (
    o.join(c, F.col("o.customer_id") == F.col("c.customer_id"), "left")
    .select(
        F.col("o.order_id"),
        F.col("o.customer_id"),
        F.col("o.amount"),
        F.col("c.segment").alias("customer_segment"),
    )
)
```

For each order, the join looks for customers with the same `customer_id`. `left` guarantees the order survives even when no customer matches; in that case `customer_segment` is null. The qualified `o.` and `c.` references show which side owns each field. This code only preserves one row per order if `customers` truly contains at most one row per customer key—hence the preceding contract.

Aliasing makes ownership explicit and prevents ambiguous columns after nontrivial joins.

## Join types with workplace uses

- **inner**: only matched facts and dimensions;
- **left**: preserve all left records while enriching them;
- **left_semi**: keep left rows that have a match, without right columns;
- **left_anti**: keep left rows that lack a match—excellent for reconciliation;
- **full**: compare two systems or snapshots, with deliberate null handling;
- **cross**: Cartesian product; require a clear, bounded reason.

```python
unknown_customer_orders = orders.join(customers, "customer_id", "left_anti")
active_customer_orders = orders.join(active_customers, "customer_id", "left_semi")
```

## Null-safe equality

Normal equality does not match null to null. Spark's null-safe equality operator is available through `eqNullSafe`:

```python
condition = (
    F.col("left.account_id").eqNullSafe(F.col("right.account_id"))
    & F.col("left.region").eqNullSafe(F.col("right.region"))
)
```

Both account and region must match. `eqNullSafe` means a null account matches another null account, and likewise for region. That can be correct for comparison/reconciliation data, but using it for identifiers can accidentally group unrelated “unknown” entities. Decide field by field instead of replacing every equality mechanically.

Matching nulls should be a business decision. For most identifiers, a null key is invalid rather than a valid “unknown” entity.

## Validate cardinality

```python
duplicate_customers = (
    customers.groupBy("customer_id").count().filter(F.col("count") > 1)
)

if not duplicate_customers.isEmpty():
    raise ValueError("customers violates the one-row-per-customer contract")
```

`groupBy().count()` calculates the observed multiplicity of every customer key. Filtering to counts above one isolates contract violations. `isEmpty()` is an action that asks whether any violation exists; place it at a quality or orchestration boundary. If duplicates are found, fail before the join multiplies fact rows and makes financial totals incorrect.

The action is appropriate at an orchestration/quality boundary, not inside a reusable transformation. At high scale, emit the count and samples to an observability sink before failing.

## Join strategy

Spark may use broadcast hash, sort-merge, shuffled hash, or other physical strategies. Inspect the physical plan. A truly small, stable dimension can be broadcast:

```python
enriched = orders.join(F.broadcast(countries), "country_code", "left")
```

The hint asks Spark to copy `countries` to executors so orders need not be redistributed by country code. This is beneficial only when the serialized country dataset safely fits executor memory. Confirm the final physical plan contains a broadcast strategy and measure the actual size; a hint is a request informed by evidence, not proof that the dataset is small.

Do not broadcast based only on row count; serialized size and executor memory matter. Let statistics and Adaptive Query Execution help before adding hints.

## Skew

If one key owns a large share of rows, one partition can dominate a join. Diagnose key frequency and task-duration distribution. Remedies include:

- fixing invalid sentinel keys such as `customer_id = 'UNKNOWN'`;
- filtering or separately processing null/heavy keys;
- broadcasting the other side when it is safely small;
- enabling and validating AQE skew handling;
- salting only after measurement, because it adds complexity and may duplicate the other side.

## Work task: reconciliation report

Given `source_orders` and `warehouse_orders`, produce:

- source-only IDs;
- warehouse-only IDs;
- matched IDs whose status or amount differs;
- a summary count and amount difference by category.

### Acceptance criteria

- Duplicate keys are checked before the comparison.
- Decimal values are compared with the agreed business precision.
- Null values are classified deliberately.
- Output records include enough source evidence to investigate.
- No full-row string concatenation is used as a fragile comparison key.

Reference: [DataFrame.join](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.join.html) and [SQL performance tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html).

## Exercises

Complete the [join, grain, and skew exercises](../exercises/02-dataframes-sql/03-joins-exercises.md).
