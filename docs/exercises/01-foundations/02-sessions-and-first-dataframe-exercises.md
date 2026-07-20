# Exercises: SparkSession and the First DataFrame

Source: [Sessions and first DataFrame](../../01-foundations/02-sessions-and-first-dataframe.md)

Estimated time: 60–90 minutes. Difficulty: beginner.

## Key terms reinforced

| Term | Definition |
|---|---|
| SparkSession | The structured-data entry point for a Spark application. |
| Schema | Column names, types, and nullability. |
| Column expression | A symbolic distributed calculation. |
| Transformation | A lazy operation returning a new DataFrame. |
| Action | An operation that triggers computation. |

## Exercise 1: Build typed input

Create an orders DataFrame containing at least eight rows, two dates, three statuses, a repeated customer, a null amount, and decimal money. Use an explicit schema.

### Deliverable

Code, printed schema, and a table stating the input grain and null meaning for every nullable field.

## Exercise 2: Daily operations metrics

Produce one row per order date with completed order count, distinct completed customers, decimal revenue, average order value, cancelled count, and cancellation rate.

### Requirements

- Use built-in column expressions.
- Do not collect intermediate rows.
- Give output money an explicit decimal type.
- Sort only for final display.

### Hint

Conditional aggregations allow complete and cancelled metrics in the same grouping.

## Exercise 3: Express the same logic in SQL

Register the fixture as a temporary view and reproduce the metrics in SQL. Compare formatted plans and list any meaningful differences.

## Self-check

- Is the output grain exactly one row per date?
- Are null amounts handled deliberately?
- Which operations are transformations and which are actions?
- Does temporary-view creation copy the dataset?

## Stretch task

Add a parameterized date/status query using `SparkSession.sql(..., args=...)` without interpolating values into SQL text.
