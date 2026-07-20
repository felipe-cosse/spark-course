# PySpark Course Reference Solutions

These are reference approaches, not answer keys that exclude other valid designs. Try each exercise first. For code tasks, run the smallest representative fixture and compare schema, rows, and execution plan. For design tasks, compare your artifact against the stated constraints and completion criteria.

## /docs/README.md#1

For a data-engineer path, a useful dependency chain is: distributed execution → schemas and types → DataFrame transformations → aggregations/windows → joins → storage → testing and quality → idempotency → tuning → streaming → workplace cases → capstones. Distributed execution explains partitions and shuffles; schemas establish contracts; transformations preserve or change grain; joins and aggregations depend on those contracts; production modules then add recovery and operational evidence.

## /docs/README.md#2

| Outcome | Evidence artifact | Verification | Reviewer |
|---|---|---|---|
| Explain execution | Annotated formatted plan | Correctly label scans, exchanges, stages, and action | Data engineer |
| Build typed pipelines | Pure transformation with explicit schemas | Unit tests include null and malformed rows | Senior engineer |
| Reconcile joins | Join contract and count/money reconciliation | Left grain and totals remain stable | Analytics engineer |
| Recover safely | Failure timeline and rerun demonstration | Same logical target after two runs | Platform engineer |
| Tune from evidence | Baseline/change report | Output equality plus plan and metric delta | Tech lead |
| Operate streaming | Checkpointed query and runbook | Restart, duplicate, and late-data drill | On-call peer |

## /docs/README.md#3

A valid four-week contract reserves three focused sessions per week: one reading/example session, one exercise session, and one review/recovery session. Exercises are due before the review block; a peer reviews one artifact weekly. Consult a hint after 20 minutes with a written hypothesis, and reveal a solution only after recording an attempted answer and the exact gap. Missed work moves into the reserved recovery block rather than silently compressing the next module.

## /docs/00-getting-started/01-course-plan.md#1

Use an evidence table with columns `skill`, `artifact`, `verification`, and `gap`. For example, a tested Python package demonstrates Python; a window-function query demonstrates SQL; a shell script with reproducible exit codes demonstrates Linux; a pytest suite demonstrates testing. Mark distributed systems “not yet demonstrated” if no plan/partition artifact exists. Limit prerequisites to the largest blockers—for example Python environments, SQL grouping/windows, and basic command-line testing.

## /docs/00-getting-started/01-course-plan.md#2

For an experienced SQL analyst on a 14-week path: weeks 1–2 cover Python environments and testing; 3–4 cover Spark execution and typed DataFrames; 5–6 translate SQL work into DataFrame/SQL plans; 7–8 cover joins, storage, and quality; 9–10 cover recovery and tuning; 11 covers streaming; 12–14 deliver and review a batch capstone. Every phase ends with an artifact. RDD internals and MLlib can be optional, but execution, schema, grain, testing, and idempotency remain prerequisites.

## /docs/00-getting-started/01-course-plan.md#3

1. “Given the approved fixture, the job publishes the expected schema and passes count and monetary reconciliation.”
2. “On the representative 200 GB dataset, p95 runtime is below 30 minutes for three consecutive runs without changing output.”
3. “Every input row appears exactly once in accepted or quarantine output, and quarantine rows contain at least one named reason.”
4. “After replaying the same checkpointed input and retrying one failed sink batch, the durable target contains one logical record per alert key.”

## /docs/00-getting-started/02-setup.md#1

The evidence note should capture `python --version`, `java -version`, `python -m pip show pyspark`, `python -c "import sys,pyspark; print(sys.executable); print(pyspark.__file__)"`, the OS version, and the exact environment activation command. Redact user names and tokens. A second learner should be able to create the environment and reproduce the same major/minor versions from this note.

## /docs/00-getting-started/02-setup.md#2

```python
from pyspark.sql import SparkSession, functions as F

def remainder_counts(spark):
    numbers = spark.range(1, 101)
    return (
        numbers.filter(F.col("id") % 3 == 0)
        .withColumn("remainder", F.col("id") % 10)
        .groupBy("remainder")
        .agg(F.count("*").alias("count"), F.sum("id").alias("sum"))
        .orderBy("remainder")
    )

spark = SparkSession.builder.master("local[2]").appName("smoke-test").getOrCreate()
try:
    result = remainder_counts(spark)
    assert result.where("remainder = 0").first()["sum"] == 180
    result.explain("formatted")
finally:
    spark.stop()
```

`collect`/`first` is the bounded assertion action, and `groupBy` introduces the likely shuffle. The remainder-zero multiples of three are 30, 60, and 90, whose sum is 180.

## /docs/00-getting-started/02-setup.md#3

| Symptom | First evidence | Smallest correction | Recovery check |
|---|---|---|---|
| Wrong Java | `java -version` and `which java` | Select the supported JDK/JAVA_HOME | Start/stop a local Spark session |
| Inactive venv | `which python` and `python -m pip show pyspark` | Activate the intended environment | Import PySpark from expected path |
| UI port occupied | `lsof -i :4040` | Stop stale process or allow Spark to select 4041 | Inspect session log/UI URL |
| Test never exits | Inspect test process and missing `spark.stop()` | Add fixture/finally cleanup | Test exits with code 0 twice |

## /docs/01-foundations/01-distributed-execution.md#1

The read is the source. `filter`, `select`, and `limit` are normally narrow. `dropDuplicates`, `groupBy().count()`, and global `orderBy` require exchanges/wide work. `collect()` is the action and the driver-memory boundary. The final grain is at most 20 rows, one per event type, ordered by count. The exact exchange placement must be confirmed in the formatted plan because Spark can combine or rearrange operators.

## /docs/01-foundations/01-distributed-execution.md#2

`range(..., numPartitions=8)` starts with eight execution partitions. `filter` normally preserves eight. `repartition(4, "bucket")` produces four partitions and an Exchange because records are redistributed by key. `coalesce(2)` narrows to two without a full shuffle. Record `rdd.getNumPartitions()` only as inspection evidence and use `explain("formatted")` to locate the exchange.

## /docs/01-foundations/01-distributed-execution.md#3

Write customer histories to a partitioned durable sink, then let a bounded notification service read one customer at a time. Aggregate the 2 TB table in Spark and export only a bounded chart dataset before converting to pandas. Write invalid rows and aggregate reason counts from executors; log only bounded samples and identifiers at the driver. Every local transfer needs an explicit row/byte limit.

## /docs/01-foundations/02-sessions-and-first-dataframe.md#1

Use an explicit schema with string identifiers/status, `TimestampType` for order time, and `DecimalType(12,2)` for amount. The input grain is one order event. A null amount means “not supplied/unknown,” not zero; make only the fields allowed by the source contract nullable. Verify with `printSchema()` and include repeated customers, a null amount, and at least two dates in the fixture.

## /docs/01-foundations/02-sessions-and-first-dataframe.md#2

```python
def daily_metrics(orders):
    complete = F.col("status") == "COMPLETE"
    cancelled = F.col("status") == "CANCELLED"
    completed_count = F.sum(F.when(complete, 1).otherwise(0))
    cancelled_count = F.sum(F.when(cancelled, 1).otherwise(0))
    result = (
        orders.withColumn("order_date", F.to_date("ordered_at"))
        .groupBy("order_date")
        .agg(
            completed_count.alias("completed_order_count"),
            F.countDistinct(F.when(complete, F.col("customer_id"))).alias("completed_customer_count"),
            F.sum(F.when(complete, F.col("amount"))).cast("decimal(14,2)").alias("revenue"),
            F.avg(F.when(complete, F.col("amount"))).cast("decimal(14,2)").alias("average_order_value"),
            cancelled_count.alias("cancelled_order_count"),
        )
        .withColumn("cancellation_rate", F.col("cancelled_order_count") / (F.col("completed_order_count") + F.col("cancelled_order_count")))
    )
    return result
```

All metrics share one date grouping. Conditional expressions ensure cancelled rows do not contribute revenue, while `avg` naturally ignores null amounts.

## /docs/01-foundations/02-sessions-and-first-dataframe.md#3

Register `orders.createOrReplaceTempView("orders")`, then use `SUM(CASE WHEN ...)`, `COUNT(DISTINCT CASE WHEN ...)`, and decimal casts in a date grouping. Compare schemas and rows first, then `explain("formatted")` for both. Catalyst normally reaches equivalent optimized plans; a syntax difference is not evidence of a different execution strategy.

## /docs/01-foundations/03-schemas-and-types.md#1

Use non-null string IDs and UTC event timestamp, `DecimalType` for amount, a constrained currency string, a nullable customer struct only if anonymous events are valid, an array of non-null item structs, nullable tags if absence differs from an empty array, and a string map for free-form attributes. Document both field nullability and `containsNull` for arrays/maps. Reject missing identity/time fields rather than silently inventing them.

## /docs/01-foundations/03-schemas-and-types.md#2

```python
def validate_orders(raw):
    parsed = (
        raw.withColumn("ordered_at", F.expr("try_cast(ordered_at_raw as timestamp)"))
        .withColumn("amount", F.expr("try_cast(amount_raw as decimal(12,2))"))
        .withColumn(
            "rejection_reasons",
            F.filter(F.array(
                F.when(F.col("order_id").isNull() | (F.trim("order_id") == ""), F.lit("missing_order_id")),
                F.when(F.col("ordered_at").isNull(), F.lit("invalid_timestamp")),
                F.when(F.col("amount").isNull(), F.lit("invalid_amount")),
                F.when(F.col("amount") < 0, F.lit("negative_amount")),
            ), lambda reason: reason.isNotNull()),
        )
    )
    valid = parsed.where(F.size("rejection_reasons") == 0).select("order_id", "ordered_at", "amount")
    rejected = parsed.where(F.size("rejection_reasons") > 0)
    return valid, rejected
```

Extend the reason array for currency, status, and overflow. Keeping raw and parsed columns until routing makes the outputs exhaustive and preserves investigation evidence.

## /docs/01-foundations/03-schemas-and-types.md#3

Parse local Los Angeles text with the named IANA zone, convert to UTC, then derive both `to_date(from_utc_timestamp(..., "America/Los_Angeles"))` and UTC date. Around the spring/fall transition, `America/Los_Angeles` changes between UTC−8 and UTC−7; a fixed `-08:00` offset therefore assigns some events the wrong instant or business date.

## /docs/01-foundations/04-rdds-and-shared-variables.md#1

```python
def purchase_totals(sc, purchases):
    return sc.parallelize(purchases).reduceByKey(lambda left, right: left + right)
```

Both `groupByKey().mapValues(sum)` and `reduceByKey` can return the same totals. `reduceByKey` performs map-side combination, sending partial totals rather than every purchase over the network; `groupByKey` materializes all values per key and creates greater shuffle and memory pressure.

## /docs/01-foundations/04-rdds-and-shared-variables.md#2

Create `lookup_bc = sc.broadcast(lookup)` outside the transformation and reference `lookup_bc.value.get(key)` inside it. Destroy/unpersist the broadcast after the last job. A broadcast serializes once per executor rather than with each task, but still consumes executor memory and is immutable from running tasks. Prefer a measured DataFrame broadcast join when the lookup is tabular because Catalyst can plan it and preserve schema/SQL semantics.

## /docs/01-foundations/04-rdds-and-shared-variables.md#3

An accumulator update can be applied more than once when a task is retried or recomputed, so it is useful telemetry but not an authoritative rejected-row total. Instead, create a rejected DataFrame with stable record keys/reasons, write it idempotently, and derive counts from that durable output or from a deterministic aggregation.

## /docs/02-dataframes-sql/01-transformations.md#1

`trim(NULL)` and `lower(NULL)` stay null; trimming blank text yields an empty string, not null. `coalesce` replaces null but does not replace blank or malformed text. A `when` predicate that evaluates to null does not enter the true branch. The prediction table should therefore keep separate columns for raw, normalized, null flag, blank flag, and final classification.

## /docs/02-dataframes-sql/01-transformations.md#2

```python
def clean_customers(customers):
    truthy = ["true", "1", "yes", "y"]
    falsy = ["false", "0", "no", "n"]
    normalized = (
        customers
        .withColumn("email", F.lower(F.trim("email")))
        .withColumn("country", F.upper(F.trim("country")))
        .withColumn("opt_in_raw", F.lower(F.trim("marketing_opt_in")))
    )
    return normalized.withColumn(
        "marketing_opt_in",
        F.when(F.col("opt_in_raw").isin(truthy), F.lit(True))
        .when(F.col("opt_in_raw").isin(falsy), F.lit(False))
        .otherwise(F.lit(None).cast("boolean")),
    ).drop("opt_in_raw")
```

For the full exercise, add native JSON parsing, higher-order tag normalization, explicit quality flags, and a final `select`. The function remains lazy and preserves one output row per customer.

## /docs/02-dataframes-sql/01-transformations.md#3

Use `row_number()` over `Window.partitionBy("customer_id").orderBy(desc("updated_at"), desc("source_sequence"), desc("event_id"))` and keep row 1. Timestamp alone is insufficient when values tie. Repartition the fixture several ways and compare selected immutable event IDs; deterministic tie-breakers make the result invariant to input ordering.

## /docs/02-dataframes-sql/02-aggregations-and-windows.md#1

`count(*)` counts rows; `count(order_id)` excludes null order IDs; `countDistinct(customer_id)` excludes null and collapses repeats; `sum(amount)` and `avg(amount)` ignore null amounts and return null when a group has no non-null amount. Your fixture should expose each difference rather than replacing null amount with zero before defining the business rule.

## /docs/02-dataframes-sql/02-aggregations-and-windows.md#2

```python
def customer_timeline(orders):
    order = Window.partitionBy("customer_id").orderBy("ordered_at", "order_id")
    cumulative = order.rowsBetween(Window.unboundedPreceding, Window.currentRow)
    lifetime = Window.partitionBy("customer_id")
    return (
        orders.withColumn("sequence", F.row_number().over(order))
        .withColumn("previous_ordered_at", F.lag("ordered_at").over(order))
        .withColumn("days_since_previous", F.datediff("ordered_at", "previous_ordered_at"))
        .withColumn("running_spend", F.sum("amount").over(cumulative))
        .withColumn("lifetime_spend", F.sum("amount").over(lifetime))
        .withColumn("lifetime_share", F.when(F.col("lifetime_spend") != 0, F.col("running_spend") / F.col("lifetime_spend")))
    )
```

The exercise fixture passed to this function already contains completed orders. In a full pipeline, filter to completed status before calling it. Grouped aggregation collapses orders to one row per group; these windows retain the completed-order grain while adding values derived from neighboring or partition-wide rows.

## /docs/02-dataframes-sql/02-aggregations-and-windows.md#3

Measure exact `countDistinct` against `approx_count_distinct` and calculate relative error as `abs(approx-exact)/exact`. Compare exact sorted percentile reasoning with `percentile_approx` at a documented accuracy. Record dataset size, seed, plan, and runtime. A tiny local result demonstrates semantics and measured error only; it does not establish production speed or memory behavior.

## /docs/02-dataframes-sql/03-joins.md#1

Orders→customers and orders→products should normally be many-to-one on non-null stable IDs, preserving order/item grain; unmatched dimensions should be flagged or quarantined according to policy. Currency rates require currency plus effective date and must match at most one rate. Promotions may be many-to-many, so either allocate before joining or declare an order-promotion bridge grain. Every contract includes pre-join uniqueness and post-join count/money reconciliation.

## /docs/02-dataframes-sql/03-joins.md#2

Create two customer rows for one key and one matching order; the left join produces two order rows and doubles its amount. Before the trusted join, compute `groupBy(key).count().where("count > 1")` and fail/quarantine when any row exists. After correcting the dimension, assert output count equals order count and summed order amount equals the source total.

## /docs/02-dataframes-sql/03-joins.md#3

```python
def reconcile_orders(source, target):
    source_only = source.join(target.select("order_id"), "order_id", "left_anti")
    target_only = target.join(source.select("order_id"), "order_id", "left_anti")
    changed = (
        source.alias("source").join(target.alias("target"), "order_id")
        .where(
            ~F.col("source.status").eqNullSafe(F.col("target.status")) |
            ~F.col("source.amount").eqNullSafe(F.col("target.amount"))
        )
        .select(
            "order_id",
            F.col("source.status").alias("source_status"),
            F.col("target.status").alias("target_status"),
            F.col("source.amount").alias("source_amount"),
            F.col("target.amount").alias("target_amount"),
        )
    )
    return source_only, target_only, changed
```

Anti joins identify keys missing in either direction; clearly named paired values retain evidence for matched changes.

## /docs/02-dataframes-sql/03-joins.md#4

Generate a key-frequency table first and prove one key exceeds 50%. The normal large join will hash-partition and can concentrate that key in one task. Broadcasting only a measured, bounded dimension removes the large-side exchange but does not fix a many-side aggregation hot key. If the key represents invalid/unknown data, separate it before the join and process it under an explicit policy. Compare plans and partition/key distributions, not local time alone.

## /docs/02-dataframes-sql/04-storage-and-semi-structured-data.md#1

Keep raw API payloads as compressed immutable JSON plus ingestion metadata; use Parquet for curated finance facts; use schema-managed Avro/JSON according to the Kafka ecosystem contract; generate CSV only as a bounded analyst export; and choose the table format/provider required by the long-lived catalog. The decision record must state typing, projection/filter pattern, compression, evolution rules, and consumers—not just “columnar is faster.”

## /docs/02-dataframes-sql/04-storage-and-semi-structured-data.md#2

```python
def parse_events(events):
    schema = "event_type string, user_id string, amount decimal(12,2), customer struct<id:string>, items array<struct<sku:string,quantity:int>>, attributes map<string,string>"
    parsed = events.withColumn("parsed", F.from_json("payload", schema))
    malformed_condition = F.col("parsed").isNull() | F.col("parsed.event_type").isNull() | F.col("parsed.user_id").isNull()
    malformed = parsed.where(malformed_condition).select("event_id", "payload")
    valid = parsed.where(~malformed_condition).select("event_id", "parsed.*")
    return valid, malformed
```

Accepted event grain is one parsed payload. Item output uses `explode_outer("items")`, preserving an event with null/empty items as one row with null item fields; document whether that is desired. Unknown JSON fields are ignored by the declared schema, while malformed raw payload is retained for investigation.

## /docs/02-dataframes-sql/04-storage-and-semi-structured-data.md#3

Write with `partitionBy("event_date")`, then read and filter `F.col("event_date") == F.lit(target_date)`. The formatted scan should show a `PartitionFilters` predicate. Wrapping the partition column in an avoidable transformation can hide pruning; rewrite the filter as direct equality or a half-open range over the stored partition field and confirm the plan again.

## /docs/02-dataframes-sql/04-storage-and-semi-structured-data.md#4

Partition by a low-cardinality business date, not customer/order ID. Target roughly 128–512 MiB files after compression, adapt writer partition count to daily volume, and compact when file count/median size violates the contract. Route late data through idempotent date-scoped rewrites or merge semantics. Use staging plus an atomic table/file commit protocol so concurrent daily and backfill writers cannot expose partial output.

## /docs/02-dataframes-sql/05-sql-and-catalogs.md#1

Implement identical predicates, grouping, aliases, and decimal casts in both APIs. Assert schema and rows are equal, then compare optimized and physical plans. In normal cases Catalyst produces equivalent scans, exchanges, aggregates, and sorts; choose syntax for maintainability unless the plan evidence shows a real semantic or optimization difference.

## /docs/02-dataframes-sql/05-sql-and-catalogs.md#2

Use CTE grains in this order: `completed_orders` one row per order; `customer_month` one row per customer-month; `refund_month` one row per customer-month; `combined` one row per customer-month after a one-to-one join; `with_previous` remains customer-month and adds `lag` over customer/month. Join to a month spine before the lag when zero-activity months must appear.

## /docs/02-dataframes-sql/05-sql-and-catalogs.md#3

Bind the start timestamp and status as typed values so quoting and escaping are not delegated to string concatenation. For identifiers, map a small user-facing choice to trusted constants such as `{“daily”: “analytics.daily_orders”}` and reject unknown values. SQL parsers treat table/column names as grammar identifiers, not scalar values, so normal value parameters cannot safely substitute them.

## /docs/02-dataframes-sql/05-sql-and-catalogs.md#4

Record the object identifier and `DESCRIBE EXTENDED` evidence for provider, table/view type, location, schema, partitioning, and statistics. Treat missing statistics as unknown rather than zero. Local catalog evidence cannot establish managed-platform permissions, concurrent commit behavior, autoscaling, or production optimizer statistics; list those as separate verification tasks.

## /docs/03-production-engineering/01-design-and-testing.md#1

Refactor into `read_inputs`/`write_outputs` adapters, lazy functions such as `normalize`, `validate`, and `aggregate`, explicit assertion functions at quality gates, and `run(config)` orchestration. Transformations accept and return DataFrames without actions. Only adapters, assertions, and orchestration may trigger actions. The dependency direction is orchestration → adapters/checks/transformations; transformation modules do not import the session or storage configuration.

## /docs/03-production-engineering/01-design-and-testing.md#2

Create a session-scoped pytest fixture and explicit schemas for every case. Assert rows with `assertDataFrameEqual` and schemas with `assertSchemaEqual`. Normal input verifies expected metrics; empty input verifies stable output schema; null amount verifies money semantics; high-precision decimal verifies no silent float conversion; duplicate ID verifies the declared duplicate policy; cancelled-only date verifies zero/null completed metrics and cancellation rate.

## /docs/03-production-engineering/01-design-and-testing.md#3

Test idempotent cleaning with `assertDataFrameEqual(clean(clean(df)), clean(df))`. Test routing with `accepted.count() + rejected.count() == input.count()` and a zero-row intersection on a stable key. Before a many-to-one enrichment, assert dimension uniqueness; afterward assert left count and contributing monetary sum are unchanged. Actions belong in these test assertions, not inside the transformation.

## /docs/03-production-engineering/02-data-quality-and-idempotency.md#1

```python
def evaluate_quality(orders):
    duplicate_ids = orders.groupBy("order_id").count().where("count > 1")
    return orders.agg(
        F.count("*").alias("total_count"),
        F.sum(F.col("customer_id").isNull().cast("long")).alias("missing_customer_count"),
        F.sum((F.col("amount") < 0).cast("long")).alias("invalid_amount_count"),
        F.sum((F.col("status").isNull() | ~F.col("status").isin("OPEN", "COMPLETE", "CANCELLED")).cast("long")).alias("invalid_status_count"),
    ).crossJoin(
        duplicate_ids.agg(F.sum(F.col("count") - 1).alias("duplicate_order_count"))
    ).withColumn(
        "valid_rate",
        F.lit(1.0) - (
            F.col("missing_customer_count") + F.col("invalid_amount_count") +
            F.col("invalid_status_count") + F.col("duplicate_order_count")
        ) / F.col("total_count"),
    )
```

For row routing, construct an array of named failures so one row can retain multiple reasons, then split on array size. Aggregate the exploded rule names for reason counts.

## /docs/03-production-engineering/02-data-quality-and-idempotency.md#2

Before transformation, a retry sees no published state and can restart from the same input identity. After staging, write to the same run/date staging scope or safely replace it. After target commit but before ledger update, the retry must detect the target commit token/version and repair the ledger rather than append again. After ledger success but before notification, notification uses a stable run key or outbox so retrying it cannot republish data or duplicate alerts.

## /docs/03-production-engineering/02-data-quality-and-idempotency.md#3

Specify a versioned canonical payload such as `v1|source=<length>:<trimmed-source>|business_id=<length>:<case-preserved-id>`, using length prefixes rather than ambiguous separators, then hash with SHA-256. Define null with a distinct marker, field order, Unicode/case policy, and whitespace policy. Tests cover null versus empty, embedded separators, normalized whitespace, case-sensitive IDs, and swapped input field order.

## /docs/03-production-engineering/02-data-quality-and-idempotency.md#4

Write each historical day to an isolated run/date staging path with a unique run ID. Validate schema, counts, quality, and money; acquire a date-level publish lock or use transactional merge/replace; record the winning artifact in a ledger; and keep the previous version for rollback. Daily processing continues with a clear conflict rule—usually newest approved source sequence—not arrival time. Enforce a byte/core-hour limit and audit owner, parameters, code version, inputs, and publish version.

## /docs/03-production-engineering/03-performance-tuning.md#1

Annotate scans with pushed filters/required columns; identify `Exchange` nodes as stage boundaries; record join type/build side; distinguish partial and final aggregates; and note final partition count. Connect each operator to expected data volume. For example, pruning before a shuffle reduces bytes, while a sort-merge join generally requires clustered/sorted inputs unless AQE chooses another strategy.

## /docs/03-production-engineering/03-performance-tuning.md#2

Capture one baseline with input identity, output hash/counts, formatted plan, runtime, shuffle, spill, and task distribution. Change only one factor—for example replace a Python UDF with native functions—then run the same fixture and configuration. Accept the change only if schema/rows reconcile and the predicted plan boundary disappears or metrics improve. Label local results as local evidence.

## /docs/03-production-engineering/03-performance-tuning.md#3

Without cache, two actions recompute the lineage. With `persist(MEMORY_AND_DISK)`, call one materializing action, run both consumers, and `unpersist()`; measure cache size/spill and total time. A materialized temporary table costs I/O but survives process loss and can be shared. Prefer recomputation when reuse is low and lineage is cheap; prefer durable output when recovery or cross-job reuse matters more than memory speed.

## /docs/03-production-engineering/03-performance-tuning.md#4

Measure `key_count / total_count` and rows per partition. Apply fixes in this order: separate invalid sentinel keys; enable/verify AQE skew handling; broadcast only a measured small dimension; salt a legitimate hot key only when simpler options fail. Salting requires expanding the compatible side and correctly recombining additive measures; distinct metrics need special care.

## /docs/03-production-engineering/04-debugging-and-observability.md#1

Ambiguous column is a contract/analysis failure—inspect schema and analyzed plan, not executor memory. Lost executor during shuffle is executor/JVM or infrastructure—inspect executor loss and fetch evidence, not rewrite business logic first. Malformed decimal-to-null is a parsing/quality contract issue. API throttling in a UDF crosses Python/external service boundaries. Expired credential is storage/security. Duplicate target after retry is orchestration/sink idempotency. Each diagnosis starts at the narrowest discriminating evidence.

## /docs/03-production-engineering/04-debugging-and-observability.md#2

Catch `PySparkException`, log a structured object containing run ID, error condition/class, SQL state when present, sanitized message, expected columns, and actual schema, then use bare `raise` to preserve the original traceback. Do not serialize records, tokens, connection strings, or full local paths. The test should assert the log fields and the original exception type.

## /docs/03-production-engineering/04-debugging-and-observability.md#3

One straggler suggests skew, a large/corrupt file, slow host, or uneven join expansion; compare task input, shuffle, duration, and key/partition size. All tasks spilling suggests insufficient execution memory or excessive per-task data; inspect spill and GC, then change task sizing in one experiment. Thousands of 100 ms tasks suggests overpartitioning/small files; compare scheduler delay and merge/coalesce input layout in a controlled test.

## /docs/03-production-engineering/04-debugging-and-observability.md#4

The decision tree first identifies the exact run and publish state, then verifies whether retry is safe. Next locate the slow SQL/stage and distinguish one-task, all-task, scheduler, or sink patterns. Mitigate with the smallest reversible action, preserve evidence, and reconcile output before restoration. Escalation includes run/config, plan, task metrics, data scope, recent change, impact, and rollback. The postmortem owns prevention work with a due date.

## /docs/03-production-engineering/05-deployment-security-and-cost.md#1

```bash
spark-submit \
  --master "${DEPLOY_MASTER}" \
  --deploy-mode "${DEPLOY_MODE}" \
  --py-files dist/orders_job.zip \
  --conf spark.sql.session.timeZone=UTC \
  --conf spark.sql.adaptive.enabled=true \
  jobs/daily_orders.py --run-date 2026-07-20 --environment prod
```

Identity, secret injection, approved runtime image, event-log destination, maximum resources, and network policy belong in platform policy. Application arguments and semantic Spark settings can be versioned with the job. Never embed credentials in the command or repository.

## /docs/03-production-engineering/05-deployment-security-and-cost.md#2

An initial conservative layout could use 4 cores per executor so a 4 GB p99 task does not multiply across too many concurrent tasks on one JVM; executor memory must cover concurrent task peaks plus execution/storage overhead and Python overhead, perhaps beginning around 20–24 GB before measurement. Start shuffle partitions from expected post-filter/shuffle bytes divided by a 128–256 MiB target, not input TB alone. Load tests must measure skew, task p99 memory, spill, GC, I/O throughput, and whether 200 cores can meet 45 minutes.

## /docs/03-production-engineering/05-deployment-security-and-cost.md#3

Orchestration assumes a workload identity and submits to the driver; driver coordinates executors; both access storage/catalog only through least-privilege network and identity boundaries. Give read permission to input prefixes, write/commit permission only to owned targets/checkpoints, and catalog permissions only for required objects. Secrets can leak through arguments, environment dumps, UDF closures, logs/UI, checkpoints, or error payloads; redact and restrict each surface.

## /docs/03-production-engineering/05-deployment-security-and-cost.md#4

Define `cost_per_processed_tb = total_run_cost / logical_input_tb` and report it beside bytes scanned, shuffle read/write, failed/retried work, file count/size distribution, idle core time, output bytes, and SLO success. A faster job may use more expensive instances, higher peak parallelism, duplicated scans, or excessive shuffle, raising total cost even while wall time falls.

## /docs/04-structured-streaming/01-streaming-model.md#1

`select` and `filter` are stateless transformations on streaming DataFrames. `groupBy` is allowed only with streaming semantics such as supported output mode and often watermark/state bounds. `count()` as a DataFrame action and `collect()` cannot directly materialize an unbounded stream. `writeStream` starts a query; `foreachBatch` supplies each finite micro-batch to batch code. `groupBy().count()` constructs a streaming aggregation—it is not the batch `df.count()` action.

## /docs/04-structured-streaming/01-streaming-model.md#2

Read the `rate` source, derive `event_id` from `value`, retain `timestamp` as event time, calculate account with `value % 5`, cast amount to a fixed decimal, filter the chosen condition, and start a console sink with a checkpoint and processing trigger. During 30 seconds, record at least two `query.lastProgress` snapshots: `numInputRows`, `inputRowsPerSecond`, `processedRowsPerSecond`, batch duration, and source start/end offsets. Always stop the query in `finally`.

## /docs/04-structured-streaming/01-streaming-model.md#3

Raw immutable events use append when the sink accepts new rows. Watermarked window counts can use append only after Spark considers the window final under the operation’s watermark semantics, or update while values change if the sink supports updates. An unbounded global count cannot finalize in append mode; use complete/update with a compatible sink and recognize unbounded state/cost.

## /docs/04-structured-streaming/01-streaming-model.md#4

Give accepted, rejected, and five-minute metrics separate checkpoint roots including application/query/environment identity. A checkpoint belongs to exactly one logical query and preserves source progress plus state/commit metadata. Retain it at least through the replay/recovery horizon and protect it like production state. Losing it turns restart into a new query, requiring an explicit source position, deduplication/reconciliation, and possibly a migration.

## /docs/04-structured-streaming/02-state-watermarks-and-joins.md#1

The five-minute windows are [10:00,10:05), [09:50,09:55), [10:20,10:25), and so on. Event contribution depends on arrival order, the maximum event time observed before each micro-batch, watermark delay, trigger/batch grouping, operation, and output mode. After observing 10:20, a 10-minute watermark is roughly 10:10; events at 10:02 or 09:50 may be too late for a stateful operation whose older state was removed. The watermark is derived from event-time progress, not wall clock, and is not a universal drop guarantee.

## /docs/04-structured-streaming/02-state-watermarks-and-joins.md#2

Assign event time and `withWatermark`, then use `dropDuplicatesWithinWatermark(["event_id"])`. Deliver repeated IDs within the horizon and verify only one logical output. Because state expires, a much later replay can pass again; make the durable sink idempotent on stable event ID or keep a longer-lived processed-event ledger/merge policy.

## /docs/04-structured-streaming/02-state-watermarks-and-joins.md#3

Payments→static merchants is a stream-static many-to-one join on merchant ID with a declared unknown-dimension flag/quarantine path; snapshot freshness is external to streaming state. Payments→authorizations is a stream-stream join on account/authorization key plus a bounded condition such as payment time between authorization time and authorization time + 10 minutes. Watermark both sides beyond measured lateness, choose supported output mode, and reason about unmatched rows/state cleanup from both watermarks and the time bound.

## /docs/04-structured-streaming/02-state-watermarks-and-joins.md#4

At 50,000 events/s, one minute contains 3,000,000 events. If “2% unique keys per minute” means 60,000 new retained keys/minute, 30 minutes gives about 1.8 million keys; two overlapping window memberships give roughly 3.6 million state rows before overhead and duplicate/repeat effects. Improve the estimate with actual distinct-key growth, overlap, serialized row bytes, watermark lag, state-store metrics, and churn.

## /docs/04-structured-streaming/03-production-streaming.md#1

Use a target transaction/merge keyed by stable record key plus batch ID. Begin or look up the batch ledger; stage/merge all records; atomically commit target changes and ledger success when the sink supports it; on retry, a successful ledger entry becomes a no-op and an incomplete transaction is rolled back/reconciled. A Spark checkpoint tracks source/query progress but cannot make an arbitrary external sink’s partial side effects atomic.

## /docs/04-structured-streaming/03-production-streaming.md#2

Specify topic ownership, partition count and ordering key, TLS/SASL identity, schema registry compatibility, source retention versus recovery horizon, maximum offsets/load controls, corrupt-record topic with original metadata, and replay procedure. `startingOffsets` and similar start options generally affect a query with a brand-new checkpoint; an existing checkpoint resumes recorded progress. Verify exact option behavior for the Spark/Kafka versions in use.

## /docs/04-structured-streaming/03-production-streaming.md#3

If batch duration exceeds the trigger, separate scheduling delay, state-store commit, sink latency, skew, and executor loss using progress and task metrics. Check source-retention headroom before any restart. Apply a reversible mitigation—sink recovery, bounded rate increase, hot-key isolation, or capacity—then restart from the same healthy checkpoint only when safe. Reconcile source offsets, batch ledger, target keys/counts, and quarantine; escalate with projected data-loss/SLA time.

## /docs/04-structured-streaming/03-production-streaming.md#4

Pure projection compatible with the existing sink may resume in place after testing. Sink-path changes usually need a deliberate new sink/query identity. Watermark, aggregation key, state schema, and shuffle/state partition count are state-affecting; prefer isolated replay plus dual run/new checkpoint and reconciliation. Never assume a query starts cleanly means old state is semantically compatible.

## /docs/05-advanced-apis/01-arrow-udfs-and-pandas.md#1

Use native expressions for phone cleanup and other scalar logic available in Spark; higher-order functions for array filtering; a pandas UDF only for vectorized proprietary NumPy logic with bounded batch memory; a regular UDF only when no vectorized/native path exists; a UDTF for one-input-to-many document expansion; pandas API on Spark for pandas-shaped distributed workflows after plan review; and an external, batched service boundary for remote model scoring. For each choice, document null semantics, dependencies, serialization boundary, retry behavior, and observability.

## /docs/05-advanced-apis/01-arrow-udfs-and-pandas.md#2

The native version uses `lower`, `trim`, `regexp_extract`, and explicit malformed/null classification. The UDF version must declare a return type and duplicate the exact policy. Compare rows/schema, then plans: the UDF plan contains a Python evaluation boundary while native expressions stay visible to Catalyst. Time several warmed local runs but conclude only that the fixture behaved a certain way; production differences depend on scale, batches, serialization, and cluster shape.

## /docs/05-advanced-apis/01-arrow-udfs-and-pandas.md#3

Create two Arrow batches whose value distributions have very different tails. Batch-local winsorization calculates different thresholds for otherwise comparable rows, making output depend on partition/batch shape. Correct it by computing global thresholds once with a Spark aggregation/approximate percentile, materializing the two scalar values, and applying native `greatest`/`least` expressions consistently.

## /docs/05-advanced-apis/01-arrow-udfs-and-pandas.md#4

Build the pandas-on-Spark groupby and rolling result, then call the Spark accessor’s plan/explain facility. Grouping introduces a key exchange; rolling requires partition/order semantics and may be expensive with a default or poorly chosen index. Treat the index as part of the distributed contract. Convert to local pandas only after a proven row/byte bound, such as a small final aggregate.

## /docs/05-advanced-apis/02-connect-data-sources-and-pipelines.md#1

Adopt Spark Connect for remote analyst notebooks if required APIs, authentication, and server operations are supported; keep a classic fallback and conformance tests. Build a Python Data Source for the proprietary store only when no maintained connector exists, with owner, retry, partition, and secret contracts. Use declarative pipelines for 40 interdependent datasets when lineage, testing, and controlled deployment justify the platform dependency. These are independent decisions, not an all-or-nothing architecture bundle.

## /docs/05-advanced-apis/02-connect-data-sources-and-pipelines.md#2

DataFrame expressions and many catalog/streaming APIs may be supported but require checking the Spark 4.2 API’s “Supports Spark Connect” marker and connector limits. Direct `SparkContext`, RDD operations, `_jvm`, and internal JVM handles are incompatible client assumptions. Python UDF availability depends on server environment packaging. Record each exact method, evidence link/version, required rewrite, and a test against the target Connect server.

## /docs/05-advanced-apis/02-connect-data-sources-and-pipelines.md#3

Parse options on the driver into validated immutable configuration; return an explicit schema; plan exactly 100 input partitions, one per shard ID; and have each executor read only its assigned shard with bounded retry. Obtain credentials from workload identity/server configuration, never serialized options. Tests assert planned shard IDs are exactly `0..99`, with no overlap/gaps, stable retry identity, schema errors, and sanitized failure messages.

## /docs/05-advanced-apis/02-connect-data-sources-and-pipelines.md#4

Define four dataset functions returning DataFrames only: raw parsing, a shared classified layer, accepted/rejected filters, and daily aggregation. Do not count, collect, write, or call external services inside definitions. Pipeline configuration declares source, target catalog/schema, dependencies, environment, and runtime properties. Release flow is validate/dry-run on fixtures → review lineage/schema changes → deploy a version → reconcile outputs → promote or roll back.

## /docs/05-advanced-apis/03-mllib-pipelines.md#1

Future cancellations and post-cutoff email activity are leakage and must be excluded or shifted to values known at cutoff. “Latest support outcome” is safe only if its source timestamp is at/before cutoff. Lifetime spend must be calculated as of cutoff, not current table state. Account age is derived from creation time and cutoff. The feature table records event/source time, point-in-time join rule, availability latency, risk, and correction.

## /docs/05-advanced-apis/03-mllib-pipelines.md#2

Split first, then create a Pipeline containing `StringIndexer(handleInvalid="keep")`, `OneHotEncoder`, numeric `Imputer`, `VectorAssembler`, and `LogisticRegression`. Fit the entire pipeline only on training data and transform validation. The unseen category goes to the kept invalid bucket; null numeric values use training-fitted imputation. Assert prediction schema and row count.

## /docs/05-advanced-apis/03-mllib-pipelines.md#3

Report area under PR because it reflects ranking under imbalance, then calculate precision/recall at candidate thresholds. Sort validation accounts by score and choose a threshold that produces no more than 100 daily reviews while maximizing expected avoided loss minus review/intervention cost. Compare against a simple rule or prevalence baseline; a model metric without capacity and cost is not an operational choice.

## /docs/05-advanced-apis/03-mllib-pipelines.md#4

Persist data snapshot/range and point-in-time rules, feature/output schemas, code/package digest, all estimator parameters, fitted PipelineModel path/digest, split IDs, metrics/threshold, random seeds, Spark/Python/library versions, and runtime configuration. A reproduction run must resolve immutable inputs/artifacts and produce metrics within declared tolerance.

## /docs/06-real-world-cases/01-orders-batch-etl.md#1

Each contract names one grain and stable key: raw event delivery, accepted event ID, quarantine event ID plus reasons, current order ID, and finance business date/currency. Use UTC instants plus explicit business timezone, fixed decimal/rounding, allowed state transitions, lateness/replay horizon, quality thresholds, data classification, owner, and freshness/recovery SLO. Cross-output equations are part of the package.

## /docs/06-real-world-cases/01-orders-batch-etl.md#2

Use fixtures with immutable event IDs and deterministic order by source sequence, event timestamp, then event ID. Parse once; quarantine malformed JSON/unknown currency; deduplicate event delivery; select the winning current order; and aggregate finance from the valid logical completed state. Expected output has one completed order at the corrected amount, one duplicate removed, two rejected cases, and deterministic tie resolution. Assert exact keys, amounts, and totals after repartitioning.

## /docs/06-real-world-cases/01-orders-batch-etl.md#3

Exact equations include `input deliveries = parseable + malformed`, `parseable = valid + business rejected`, and `valid deliveries = unique events + duplicate deliveries`. Current-order count is at most unique valid order keys, not equal when histories exist. Finance total must equal the contributing current completed orders after dimension policy. Unknown-dimension rate and quality rejection rates are thresholds with a denominator and SLO, not equality equations.

## /docs/06-real-world-cases/01-orders-batch-etl.md#4

Staging is run-scoped and safely replaceable. Validation failure publishes nothing. Target commit uses transaction/versioned replace or idempotent merge; a retry after commit reads the commit marker and repairs the ledger rather than adding rows. Backfills use date/key conflict locks and the same source-order rule as daily jobs. Every point records input version, run ID, staged artifact, target version, and ledger status.

## /docs/06-real-world-cases/02-incremental-and-cdc.md#1

Arrival sequence 10 inserts the row; 12 replaces current; replay 10 is retained in audit but ignored for current; delete 15 creates a tombstone/current-deleted state; late update 11 is audit-only and cannot resurrect; new insert 20 becomes current only if the policy permits reinsertion after deletion. The audit is arrival-append with source sequence and disposition; current state is chosen by source order plus operation rules, never arrival order.

## /docs/06-real-world-cases/02-incremental-and-cdc.md#2

Within a micro-batch, use `row_number` per business key ordered by descending source sequence, source event time, partition/offset, and event ID. Apply only when incoming sequence is greater than target sequence (or an explicitly defined tie-break wins). Test tied timestamps across repartitions, replayed lower sequences, duplicate offsets, and delete precedence. The sink merge predicate enforces the rule again to protect concurrent/retried batches.

## /docs/06-real-world-cases/02-incremental-and-cdc.md#3

Initial history is `[Jul 1, Jul 10)` and `[Jul 10, ∞)`. Inserting a Jul 5 correction splits the first interval into `[Jul 1, Jul 5)`, `[Jul 5, Jul 10)`, leaving `[Jul 10, ∞)`. Use half-open intervals, assert each `effective_from < effective_to`, lag/lead boundaries touch without overlap, and exactly one row has open end/current flag.

## /docs/06-real-world-cases/02-incremental-and-cdc.md#4

Keep tombstones at least as long as the maximum replay/rebuild horizon, and retain an access-controlled audit according to regulation. Regulatory deletion may require cryptographic/physical erasure of payload while preserving a non-sensitive suppression key. Rebuild applies ordered events plus tombstones; an old insert/update with sequence below the tombstone cannot become current. Reinsertion needs an explicit newer event and policy.

## /docs/06-real-world-cases/03-streaming-fraud-design.md#1

Trace a stable payment/event ID through each boundary: raw bytes → parsed or quarantine → deduplicated event → versioned merchant/customer enrichment → velocity feature state → model/rule score → durable alert keyed by condition/window/version → notification outbox → immutable archive. At every step name schema/grain, failure before/after durable commit, and whether retry reuses the same key. Notifications occur only after the alert commit.

## /docs/06-real-world-cases/03-streaming-fraud-design.md#2

Choose watermark delays from an observed lateness percentile plus business loss tolerance, not convenience. Maintain separate one- and five-minute bounded windows/state, estimate rows from key cardinality × horizon × overlap, and monitor state-store size/commit time. Route later events to durable late storage and recompute correction features/decisions offline; online alerts remain versioned and reconcilable.

## /docs/06-real-world-cases/03-streaming-fraud-design.md#3

Canonicalize `rule_or_model_version | tokenized_subject | condition_id | window_start` and hash it as the alert key. Transactionally upsert the durable alert/outbox first; a notifier reads unsent rows and records delivery idempotently. If the client times out after commit, retrying the same key reads the existing alert and does not create a second notification intent.

## /docs/06-real-world-cases/03-streaming-fraud-design.md#4

For an incompatible schema, detect parse/quarantine spikes and schema-registry errors, pause affected consumption without deleting the checkpoint, preserve offsets/raw payloads, deploy a backward-compatible parser or route version, then replay and reconcile counts. For a hot merchant, detect key/state/task skew, apply rate/route isolation or dedicated processing, verify alert equivalence, and add hot-key dashboards/load tests as prevention.

## /docs/06-real-world-cases/04-performance-incident.md#1

Check: exact run/artifact/config; business impact/SLA; target publish/ledger state; retry safety; current SQL/stage; max/median task duration; input/shuffle/spill per task; top-key frequency; join-side uniqueness/cardinality; recent code/data/config/infrastructure changes. Adding memory first can hide skew or correctness multiplication, increase cost, and destroy evidence without addressing the mechanism.

## /docs/06-real-world-cases/04-performance-incident.md#2

Sentinel skew shows one dominant key/partition and a straggler without widespread corrupt-file errors. A duplicate dimension shows pre-join duplicate keys plus post-join row/money multiplication, possibly with broad work rather than one hot key. A corrupt large file points to one input path/task and read/decode errors. A lost executor shows executor removal, fetch/retry events, and possibly different replacement tasks without deterministic key concentration.

## /docs/06-real-world-cases/04-performance-incident.md#3

For confirmed sentinel skew, baseline the same representative input and capture top-key share, partition sizes, plan, max/median task time, shuffle, output counts/money, and cost. Make one change: route the sentinel key to quarantine before the join. Rerun, prove non-sentinel output and reconciliation are unchanged, quantify task distribution/SLA effect, and roll back by restoring the previous artifact/config if quality or downstream contracts fail.

## /docs/06-real-world-cases/04-performance-incident.md#4

Executive update: “The 02:00 order pipeline is delayed; no partial finance output is published. A single invalid customer key is concentrating join work. We isolated that traffic and are validating corrected output. Customer-facing systems are unaffected; finance delivery is projected 45 minutes late. Next update at 04:00.” Technical note includes key share, stage/task evidence, isolation mechanism, count/money reconciliation, and rollback. Prevention: Data Platform owner adds sentinel-key threshold/quarantine by 2026-07-27.

## /docs/07-capstones/01-batch-capstone.md#1

A passing Gate 1 package contains a source-to-target matrix; explicit schema/grain/key/cardinality; UTC/business-date and decimal rules; exhaustive quality routing and thresholds; data classification; freshness/recovery SLO; and named owners. Approval records unresolved assumptions. Implementation should not broaden until high-risk contract questions are closed.

## /docs/07-capstones/01-batch-capstone.md#2

Use one finite day that includes valid, duplicate, malformed, late/corrected, missing-dimension, and tie cases. Produce accepted, quarantine, current order, customer enrichment, and finance outputs through pure functions. Tests assert schema/rows plus exact input-routing and monetary equations. Repartition the fixture to prove deterministic winners.

## /docs/07-capstones/01-batch-capstone.md#3

Run once, rerun identical input, inject a late higher-sequence correction, fail before publish, then simulate commit-before-ledger failure. After every step record staging identity, target version/rows/money, and ledger status. The logical target must remain single-valued and recoverable; retry repairs metadata or performs the same idempotent merge.

## /docs/07-capstones/01-batch-capstone.md#4

Inject one hot key and many small files, capture a correctness/performance baseline, and change one factor—such as invalid-key isolation or compaction. Compare exact output equivalence, plan, file/partition distribution, max/median task time, shuffle/spill, runtime, and cost. State whether the result is local or representative-scale evidence.

## /docs/07-capstones/01-batch-capstone.md#5

The receiving learner uses only deployment config, dashboards/alerts, and the runbook to identify an injected failure, determine retry/publish safety, mitigate, and verify recovery. Record every question they had to ask and every missing metric/decision. Update the artifacts and repeat until the handoff succeeds without author-only knowledge.

## /docs/07-capstones/02-streaming-capstone.md#1

A passing stream contract fixes envelope/payload versioning, compatibility policy, event/processing time, measured lateness and watermark, duplicate horizon, quarantine behavior, source retention/replay, unique checkpoint ownership, and sink idempotency/transaction guarantee. It also states what happens beyond every bound.

## /docs/07-capstones/02-streaming-capstone.md#2

First test parsing, classification, feature logic, and keys as pure transformations on finite DataFrames. Then run a real source→checkpoint→durable sink query, capture at least two progress snapshots and source positions, stop/restart it, and verify durable keys/counts. The finite loop finds logic errors quickly; the streaming loop verifies engine/recovery semantics.

## /docs/07-capstones/02-streaming-capstone.md#3

For every injected failure, record detection signal, source/checkpoint position, target and ledger state, safe recovery action, and post-recovery reconciliation. Duplicates and partial sink failure must prove idempotency; late data must prove bounded online plus correction behavior; schema/hot-key/backlog cases must preserve data and recovery headroom.

## /docs/07-capstones/02-streaming-capstone.md#4

Create v2 with a deliberate state-affecting key or watermark change. Replay an isolated bounded range into a new checkpoint/target, dual-run v1/v2 over a comparison window, reconcile keys/windows/measures, then atomically redirect consumers. Preserve v1 checkpoint/target until rollback expires; never point v2 state logic at v1 checkpoint.

## /docs/07-capstones/02-streaming-capstone.md#5

Demonstrate source progress before stop, restart from the same checkpoint without gaps, duplicate input suppression, a late event entering correction policy, progress/state/sink metrics, and one runbook drill. Evidence includes IDs/offsets, checkpoint identity, durable target reconciliation, timestamps, and the operator’s decisions.

## /docs/07-capstones/03-rubric-and-review.md#1

The polished demo lacks recovery evidence, so reliability/idempotency cannot score above “not demonstrated” regardless of presentation. Correct code without security/runbook evidence can score correctness but not production readiness. The plain submission with tests, recovery drill, and reconciliation earns stronger engineering dimensions; presentation is improved separately. Every score cites an artifact and marks unavailable dimensions “missing evidence,” not inferred failure.

## /docs/07-capstones/03-rubric-and-review.md#2

Example join finding: “Evidence: customer key `c7` appears twice and the join increases 100 orders to 103 and revenue by $42. Risk: trusted finance output is overstated. Recommendation: enforce dimension uniqueness before the many-to-one join and quarantine failures. Verification: the duplicate fixture fails the gate; corrected fixture preserves count and money.” Apply the same evidence→risk→smallest fix→risk-focused verification structure to tests, streaming sink retries, cost metrics, and least-privilege identity.

## /docs/07-capstones/03-rubric-and-review.md#3

The review report separates blocking correctness/recovery/security findings from non-blocking improvements, open questions, and accepted limitations. Each finding links exact evidence and a reproducible check. The author can supply new evidence; the reviewer then closes, revises, or retains the finding with a written reason. Severity is based on impact and likelihood, not tone.

## /docs/reference/cheat-sheet.md#1

The recalled page should include minimal, typed patterns for `SparkSession.builder`, explicit `StructType`, `filter`, `when/otherwise`, `groupBy().agg`, deterministic `row_number` window, `left_anti`, Parquet write, `assertDataFrameEqual`, and `writeStream.option("checkpointLocation", ...)`. Corrections should explain the semantic mistake—especially missing action, schema, tie-breaker, or checkpoint ownership—not merely copy syntax.

## /docs/reference/cheat-sheet.md#2

For each snippet, identify what one row means before and after. Filters/selects preserve grain; grouped aggregation collapses to group grain and usually shuffles; deterministic latest-row windows preserve detail until filtering and require exchange/order; anti join keeps unmatched left grain and shuffles unless planned otherwise; writes/assertions/start are actions. A transformation-only snippet has no trigger and must be labeled lazy.

## /docs/reference/cheat-sheet.md#3

Replace unbounded `collect` with a distributed write/aggregate and an explicitly bounded sample. Replace unconditional `repartition(1)` with a file-size/consumer contract and controlled partition count. Replace duplicate built-in UDF logic with native expressions. Replace append-on-retry with stable-key merge or atomic partition replace plus ledger. Give every stream a unique, durable checkpoint and an idempotent sink contract.

## /docs/reference/glossary.md#1

An action triggers a job; a job contains stages separated by shuffle boundaries; a stage contains tasks; each task processes one execution partition on an executor; the driver builds/co-ordinates the plan; executors run tasks; a shuffle redistributes records between partitions/stages. Use verb-labeled arrows and avoid implying one permanent mapping from storage files to tasks.

## /docs/reference/glossary.md#2

A transformation builds a lazy DataFrame plan; an action requests a result, such as a write. A storage partition organizes persisted data while an execution partition is a task-sized runtime slice. Event time belongs to the event; processing time belongs to the engine. DataFrames provide schema/optimizer semantics; RDDs expose lower-level distributed objects. Checkpoints preserve recovery/state; cache accelerates reuse. Idempotency means retry has the same logical effect; exactly-once is an end-to-end claim requiring source, engine, and sink evidence.

## /docs/reference/glossary.md#3

One file may split into multiple partitions, and many small files may be combined. More partitions can increase scheduling and file overhead. A watermark bounds state/finality for specific operations; it is not a universal “drop all old rows” rule. Broadcast consumes executor memory and can fail when mismeasured. A successful engine retry can duplicate a non-idempotent external sink, so success alone proves no end-to-end exactly-once behavior.

## /docs/reference/references.md#1

Use the official Spark installation/version matrix for Python support, the Spark 4.2 Python API for a method signature, Apache Kafka’s official broker/topic documentation for retention, Google Cloud’s Dataproc documentation for autoscaling, and Spark 4.2 migration/config/API documentation for Arrow defaults. Primary versioned sources define the actual contract; tutorials help interpretation but do not override it.

## /docs/reference/references.md#2

Choose one older example, reproduce its claim/version, and compare the exact Spark 4.2 signature/default/migration note. The correction should say: what changed, the first/target version, compatible replacement, and whether semantics or only syntax/default changed. Include a minimal test because documentation disagreement can hide environment or provider differences.

## /docs/reference/references.md#3

For a provider tuning recommendation, isolate the general principle—for example right-size shuffle partitions—from the provider’s default value and managed capability such as autoscaling or optimized runtime. On another platform, verify Spark version, adaptive settings, storage connector, instance/network characteristics, task metrics, output equality, and cost before transferring the recommendation.

## /docs/reference/troubleshooting.md#1

For every symptom, list mutually distinguishable hypotheses. Wrong total: join multiplication, null/duplicate policy, or wrong grain. Driver OOM: collect/toPandas, oversized broadcast metadata, or driver result limit. Executor OOM/fetch/missing file/backlog/checkpoint each require task, storage, source-progress, or state-compatibility evidence. An unsafe premature action is any destructive retry, memory increase, repartition, or checkpoint deletion before publish/recovery state is known.

## /docs/reference/troubleshooting.md#2

One 40-minute task points to skew/large file/host; inspect task input and key share, then isolate one partition/key. All tasks spilling/GC suggests per-task memory pressure; inspect spill and task sizing, then test a partition/memory change. 100,000 tiny tasks suggests small files/overpartitioning; compare scheduler delay and compact inputs. All tasks blocked on a sink points to external throughput; measure sink latency/throttling and test bounded batching/backpressure. Verify both performance and output after each experiment.

## /docs/reference/troubleshooting.md#3

The escalation bundle contains application/run ID, immutable artifact/config digest, exact sanitized error and timestamp, logical/physical plan, stage/task distribution, source/input identity, target/ledger publish state, retry-safety assessment, impact/SLO, and changes since last success. Remove credentials, personal row data, and unnecessary local paths. A responder should be able to discriminate the leading hypotheses without asking for basic evidence.

## /docs/reference/troubleshooting.md#4

Before deleting a checkpoint, identify query/version, source offsets and retention, stateful operators/schema/partition count, sink idempotency, committed batch/target ledger, replay volume, and reconciliation/rollback plan. Prefer an in-place restart when state is compatible. For incompatible change, use a new checkpoint and isolated target, replay/dual-run, reconcile, cut over, and retain the old version for rollback.
