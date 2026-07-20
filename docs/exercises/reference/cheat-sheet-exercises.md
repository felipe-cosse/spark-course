# Exercises: Cheat-sheet Recall

Source: [PySpark cheat sheet](../../reference/cheat-sheet.md)

Estimated time: 45–75 minutes. Difficulty: mixed recall.

## Key terms reinforced

| Term | Definition |
|---|---|
| Retrieval practice | Recalling information without looking at the source. |
| Predicate | Boolean expression used to filter, classify, or join. |
| Projection | Output-column selection/calculation. |
| Window | Related-row context preserving row grain. |
| Action | Operation that triggers Spark execution. |

## Exercise 1: Blank-page recall

Without opening the cheat sheet, write minimal patterns for session creation, explicit DataFrame schema, filter, conditional column, grouped aggregation, deterministic latest row, anti join, Parquet write, DataFrame assertion, and streaming checkpoint.

Compare afterward and correct errors in another color or revision.

## Exercise 2: Name grain and action

For every cheat-sheet snippet, state input grain, output grain, whether a shuffle is likely, and which line triggers execution. If no action exists, state that explicitly.

## Exercise 3: Correct unsafe snippets

Write safer alternatives for unbounded `collect`, `repartition(1)`, a UDF that duplicates a built-in, append-on-retry, and a stream without checkpoint ownership.

## Self-check

- Can you write patterns without copying?
- Do you distinguish syntax recall from semantic correctness?
- Are all collected results bounded?
- Are joins and writes accompanied by contracts?

## Stretch task

Create a personal one-page cheat sheet containing only concepts you failed to retrieve, then repeat the exercise one week later.
