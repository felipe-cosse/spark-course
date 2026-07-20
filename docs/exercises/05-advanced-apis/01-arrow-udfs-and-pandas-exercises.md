# Exercises: Arrow, UDFs, and pandas API on Spark

Source: [Arrow, UDFs, UDTFs, and pandas](../../05-advanced-apis/01-arrow-udfs-and-pandas.md)

Estimated time: 100–150 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Arrow | Columnar memory format used for cross-runtime batch exchange. |
| Vectorization | Applying logic to batches rather than one scalar call at a time. |
| UDF | Custom function returning one value per input row. |
| UDTF | Custom function returning zero or more rows. |
| Optimizer visibility | How much of an operation Spark can inspect and optimize. |

## Exercise 1: API decision ladder

Choose native expression, higher-order function, pandas UDF, regular UDF, UDTF, pandas API on Spark, or external service for ten requirements, including phone cleanup, array filtering, proprietary NumPy function, document expansion, and remote model scoring. Justify semantics, dependencies, execution boundary, and failure behavior.

## Exercise 2: Native versus UDF

Implement email-domain extraction and normalization with built-ins and with a Python UDF. Compare null/malformed behavior, schema, formatted plan, and local performance. Explain why a small local timing is not a production conclusion.

## Exercise 3: Batch-local semantic trap

Reproduce the winsorization example on data whose Arrow batches have different distributions. Show why batch-local percentiles differ from global thresholds. Correct the design by calculating thresholds once and applying native expressions.

## Exercise 4: pandas API plan

Create a pandas-on-Spark groupby and rolling calculation. Inspect its Spark plan, identify shuffles/order operations, and explain index behavior. Bound any conversion to local pandas.

## Self-check

- Did you prefer built-ins when they express the rule?
- Are UDF return types explicit and tested?
- Are global/group/batch semantics distinguished?
- Is every local collection deliberately bounded?

## Stretch task

Design a UDTF for a custom record expansion and a test matrix covering zero, one, many, null, and malformed outputs without implementing unnecessary external I/O.
