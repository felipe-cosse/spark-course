# Exercises: DataFrame Transformations

Source: [DataFrame transformations](../../02-dataframes-sql/01-transformations.md)

Estimated time: 90–120 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Pure transformation | DataFrame logic with no hidden I/O or action. |
| Projection | Selection and calculation of output columns. |
| Normalization | Converting equivalent values to one standard form. |
| Higher-order function | An expression operating on array/map elements. |
| Deterministic deduplication | Selecting duplicates through a complete, stable ordering rule. |

## Exercise 1: Predict row behavior

Given rows containing null, blank, mixed-case, and malformed email/status values, predict the output of `trim`, `lower`, `coalesce`, and a chained `when`. Identify where null behaves differently from blank text.

### Deliverable

An input/output table written before running Spark, followed by observed differences and corrections.

## Exercise 2: Build a pure customer cleaner

Write `clean_customers(df)` that:

- trims IDs and names;
- normalizes email and phone;
- parses a preference JSON struct;
- normalizes and deduplicates an array of tags with higher-order functions;
- creates explicit quality flags;
- returns a selected output schema.

Do not read, write, count, display, or use a Python UDF inside the function.

### Hint

Separate normalization from validation so a malformed value is not accidentally made to look valid.

## Exercise 3: Deterministic latest record

Create duplicate updates per customer, including equal `updated_at` values. Select one latest row using a source sequence and immutable event ID as tie-breakers. Shuffle/repartition the input and prove the chosen rows stay unchanged.

## Self-check

- Is every output column intentional?
- Are null and blank semantics documented?
- Does the function preserve raw evidence needed by validation?
- Is the duplicate ordering complete and stable?

## Stretch task

Implement the same cleaner using `DataFrame.transform` to compose three named pure transformations. Explain whether composition changes the optimized plan.
