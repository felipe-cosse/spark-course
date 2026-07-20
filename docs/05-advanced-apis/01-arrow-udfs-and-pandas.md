# Arrow, Python UDFs, UDTFs, and pandas API on Spark

## Key terms on this page

| Term | Definition |
|---|---|
| Apache Arrow | A language-neutral columnar memory format used to exchange batches efficiently between runtimes. |
| Python/JVM boundary | The serialization and process boundary between Python workers and Spark's JVM execution engine. |
| UDF | A user-defined scalar function that returns one value for each input row. |
| pandas UDF | A vectorized Python function that receives and returns pandas objects through Arrow batches. |
| UDTF | A user-defined table function that can emit zero or more output rows per invocation. |
| Vectorization | Applying an operation to a batch/array of values instead of invoking Python logic once per scalar row. |
| Type coercion | Conversion of a value from one data type to another according to defined rules. |
| pandas API on Spark | A pandas-like distributed API whose operations are executed by Spark. |
| Optimizer visibility | How much of an operation Spark can inspect, rearrange, simplify, or push into a data source. |
| Grouped operation | An operation that sends all rows for a logical group to the same function or aggregation. |

## Spark 4.2 behavior to know

In PySpark 4.2, Arrow-based columnar exchange between Python and the JVM is enabled by default, and regular Python UDFs and UDTFs are Arrow-optimized by default. The minimum PyArrow version is 18.0.0. These changes improve many Python boundaries and can change coercion behavior from earlier versions, so migration testing matters.

## API decision ladder

1. Native DataFrame/SQL functions: best optimizer visibility and usually the best default.
2. Higher-order array/map functions and SQL expressions.
3. pandas UDF for vectorized custom logic with a clear schema and measurable benefit.
4. Regular Python UDF when vectorization does not fit.
5. Python UDTF when one input row or argument needs to return multiple rows.

Do not choose a UDF just because the Python version is familiar.

## Native expression

```python
import pyspark.sql.functions as F

normalized = customers.withColumn(
    "email_domain",
    F.lower(F.element_at(F.split("email", "@"), -1)),
)
```

This expression splits each email at `@`, selects the last segment, and lowercases it. Spark can see every step, combine it with adjacent filters/projections, and generate engine-native execution. Test malformed addresses: a missing `@` may still produce a last segment, so extraction is not the same as validation.

## Scalar pandas UDF

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf

@pandas_udf("double")
def winsorize(values: pd.Series) -> pd.Series:
    lower = values.quantile(0.01)
    upper = values.quantile(0.99)
    return values.clip(lower=lower, upper=upper)

scored = features.withColumn("bounded_score", winsorize("score"))
```

Spark sends an Arrow batch of `score` values to a Python worker as a pandas `Series`. The function calculates batch-local 1st and 99th percentiles and clips values outside them, then Arrow carries the returned series back. This reduces per-row serialization overhead but creates the semantic problem described below: each batch can calculate different thresholds. The example is useful because it shows that faster execution does not guarantee the intended statistical definition.

This example computes quantiles within each Arrow batch, not across the entire distributed dataset. That may be semantically wrong for a global winsorization requirement. Calculate global thresholds as a separate aggregation and apply them with native expressions instead. Vectorization does not repair a wrong grouping boundary.

## Grouped pandas work

Grouped map/apply operations can materialize an entire group in Python. A single hot key can exhaust worker memory. Define expected maximum group size and prefer native grouped aggregations when possible.

## pandas API on Spark

```python
import pyspark.pandas as ps

psdf = ps.DataFrame({
    "customer_id": ["c1", "c1", "c2"],
    "amount": [10.0, 15.0, 8.0],
})

customer_totals = psdf.groupby("customer_id")["amount"].sum()
```

Although the syntax resembles local pandas, `groupby().sum()` creates a distributed Spark aggregation and normally a shuffle by customer ID. The result is lazy until displayed, converted, or otherwise materialized. The default index is also part of pandas-on-Spark planning; avoid carrying an expensive implicit index when a stable domain key is available.

Pandas API on Spark can help migrate familiar pandas workloads, but operations still become distributed Spark plans. Avoid assumptions about implicit row order, cheap index operations, or local iteration. The PySpark overview recommends DataFrames when users are choosing an API rather than migrating an existing pandas workload.

Use `to_pandas_on_spark()` / `to_spark()` conversions deliberately. `toPandas()` moves all rows to the driver and requires an explicit size bound.

## Python UDTFs

A user-defined table function returns zero or more rows per invocation. It is useful for custom parsing or expansion not expressible with `explode` and built-ins. It requires an explicit output schema and has the same concerns about Python boundaries, determinism, errors, and observability.

## Profiling and testing

- Test nulls, NaN, decimals, dates/timestamps, nested types, and empty batches.
- Compare native and UDF versions for correctness before performance.
- Measure CPU, serialization, worker memory, batch sizing, and end-to-end stage time.
- Review Spark 4.2 migration behavior if upgrading from 4.1 or earlier.

## Work task: API choice record

For each requirement, choose native expressions, pandas UDF, regular UDF, UDTF, pandas API on Spark, or a separate service:

- normalize phone numbers;
- apply a proprietary vectorized scientific function;
- tokenize text with a large model;
- expand a custom compressed payload into rows;
- migrate a 300-line pandas report;
- calculate a seven-day rolling sum.

### Acceptance criteria

- Each choice addresses correctness and execution boundaries.
- External models consider dependency size, initialization, batching, and retries.
- The plan does not call `toPandas()` on unbounded data.
- At least one UDF proposal is replaced with a built-in/window expression.

References: [Spark 4.2 PySpark migration guide](https://spark.apache.org/docs/4.2.0/api/python/migration_guide/pyspark_upgrade.html), [Arrow in PySpark](https://spark.apache.org/docs/4.2.0/api/python/tutorial/sql/arrow_pandas.html), [Python UDFs/UDTFs](https://spark.apache.org/docs/4.2.0/api/python/user_guide/udfandudtf.html), and [pandas API best practices](https://spark.apache.org/docs/4.2.0/api/python/tutorial/pandas_on_spark/best_practices.html).

## Exercises

Complete the [Arrow, UDF, UDTF, and pandas exercises](../exercises/05-advanced-apis/01-arrow-udfs-and-pandas-exercises.md).
