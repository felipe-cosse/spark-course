# Schemas, Types, Nulls, and Time

## Key terms on this page

| Term | Definition |
|---|---|
| Schema | The formal description of a dataset's columns, types, and nullability. |
| StructField | One named field in a `StructType`, with a data type and nullability flag. |
| Nullability | Whether a field is permitted to contain an unknown or missing value. |
| Precision | The maximum total number of decimal digits. |
| Scale | The number of decimal digits stored to the right of the decimal point. |
| ANSI mode | Spark SQL behavior that favors standards-based errors for invalid operations such as unsafe casts. |
| Quarantine | A controlled output for invalid records that preserves evidence for repair or investigation. |
| Timezone | A named set of civil-time rules, including daylight-saving changes. |
| Struct | A nested record with a known set of named fields. |
| Array | An ordered collection of elements stored inside one column value. |
| Map | A collection of key/value pairs stored inside one column value. |

## Scenario

An upstream CSV changes `amount` from `19.95` to `unknown`, timestamps arrive with offsets, and a nested JSON field disappears. A production pipeline must decide what is invalid rather than letting inference make that decision accidentally.

## Define contracts explicitly

```python
from pyspark.sql.types import (
    ArrayType,
    DecimalType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

order_schema = StructType([
    StructField("order_id", StringType(), nullable=False),
    StructField("ordered_at", TimestampType(), nullable=False),
    StructField("amount", DecimalType(18, 2), nullable=True),
    StructField(
        "tags",
        ArrayType(StringType(), containsNull=False),
        nullable=True,
    ),
])
```

Read the schema as a contract sentence: every order has a non-null string ID and timestamp, may have a decimal amount with up to 16 digits before and 2 after the decimal point, and may have an array of tags whose elements themselves cannot be null. The outer `tags` array may still be null because the field's own `nullable` value is `True`.

Schema nullability is useful documentation and affects some optimizations, but it is not a complete data-quality system. Validate business rules in the pipeline and at the storage boundary.

## Read permissively, validate deliberately

CSV is text, so preserve malformed evidence before casting:

```python
import pyspark.sql.functions as F

raw = (
    spark.read
    .option("header", True)
    .schema("order_id string, ordered_at_raw string, amount_raw string")
    .csv("/data/incoming/orders/*.csv")
)

typed = (
    raw
    .withColumn("ordered_at", F.to_timestamp("ordered_at_raw", "yyyy-MM-dd'T'HH:mm:ssXXX"))
    .withColumn("amount", F.col("amount_raw").cast("decimal(18,2)"))
)

invalid = typed.filter(
    F.col("order_id").isNull()
    | F.col("ordered_at").isNull()
    | (F.col("amount").isNull() & F.col("amount_raw").isNotNull())
)
```

This example intentionally keeps `ordered_at_raw` and `amount_raw`. The typed columns are added beside the original evidence so a failed parse can be distinguished from a genuinely missing input. The invalid predicate detects missing identifiers/timestamps and the specific case where a present amount string cannot become a decimal. In production, add a rejection reason per rule instead of only a single Boolean filter.

In ANSI mode, invalid casts can raise errors rather than silently return null. When tolerant parsing is intentional, use the appropriate `try_*` SQL function, such as `try_cast` through `F.expr`, and route rejected records with a reason.

```python
typed = raw.withColumn(
    "amount",
    F.expr("try_cast(amount_raw AS DECIMAL(18,2))"),
)
```

`try_cast` turns an invalid amount into null instead of stopping the whole query. That behavior is only useful when the next step identifies the null as a rejected conversion. Without that validation, tolerant parsing can silently convert bad business data into missing data.

## Money and precision

Use `DecimalType` for financial quantities that require decimal semantics. State precision and scale as a business contract. Decide how to round and what to do when a value exceeds the precision.

## Timestamps

Three decisions must be explicit:

1. What timezone or offset does the source represent?
2. What session timezone is used to parse and display values?
3. Is the business date based on UTC or a local operating timezone?

```python
spark.conf.set("spark.sql.session.timeZone", "UTC")

with_business_date = typed.withColumn(
    "los_angeles_date",
    F.to_date(F.from_utc_timestamp("ordered_at", "America/Los_Angeles")),
)
```

Do not derive a business date before establishing timestamp semantics. Daylight-saving transitions make fixed offsets unsafe for civil time.

## Nested and semi-structured types

Use `StructType`, `ArrayType`, and `MapType` to preserve structure. A struct has a known schema; a map is better for open-ended key/value attributes.

```python
payload_schema = "order_id string, customer struct<id:string,tier:string>, items array<struct<sku:string,qty:int>>"

parsed = raw_json.withColumn(
    "payload",
    F.from_json("value", payload_schema),
)

items = (
    parsed
    .select("payload.order_id", F.explode_outer("payload.items").alias("item"))
    .select("order_id", "item.sku", "item.qty")
)
```

`from_json` converts the string payload into a typed struct. The first `select` keeps the order ID and expands the items array: each item becomes a separate row. `explode_outer` also preserves an order with a null or empty items array by producing a row whose `item` is null. The second `select` flattens the nested fields. The grain therefore changes from one row per payload to one row per order item, plus an explicit null-item row for empty orders.

`explode_outer` retains a row for null or empty arrays; `explode` does not. Choose based on the intended output grain.

## Work task: contract and quarantine

Design an order-ingestion result with two outputs:

- valid typed rows;
- rejected raw rows with `rejection_reasons: array<string>` and `ingested_at`.

Validate missing IDs, malformed timestamps, negative amounts, unsupported statuses, and precision overflow.

### Acceptance criteria

- Every input row appears in exactly one output.
- Original raw values remain available in the rejection output.
- Multiple reasons can be recorded for one row.
- Timezone and money decisions are documented.
- Validation does not collect the source dataset to the driver.

Further reading: [PySpark data types](https://spark.apache.org/docs/4.2.0/api/python/user_guide/touroftypes.html), [SQL data types](https://spark.apache.org/docs/4.2.0/sql-ref-datatypes.html), and [SQL ANSI compliance](https://spark.apache.org/docs/4.2.0/sql-ref-ansi-compliance.html).

## Exercises

Complete the [schemas, types, nulls, and time exercises](../exercises/01-foundations/03-schemas-and-types-exercises.md).
