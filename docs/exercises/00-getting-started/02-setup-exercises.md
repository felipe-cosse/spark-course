# Exercises: Local Setup

Source: [Local setup for PySpark 4.2](../../00-getting-started/02-setup.md)

Estimated time: 45–75 minutes. Difficulty: introductory.

## Key terms reinforced

| Term | Definition |
|---|---|
| Runtime | The environment that executes program code and dependencies. |
| Virtual environment | An isolated Python package installation. |
| Local mode | Spark execution on a single computer. |
| SparkSession | The entry point for structured Spark operations. |
| Smoke test | A small test proving the most important setup path can run. |

## Exercise 1: Capture reproducible environment evidence

Record Python, Java, and PySpark versions; Python executable path; PySpark package path; operating system; and the command used to activate the environment.

### Deliverable

An `environment-evidence.md` note with commands and outputs, excluding personal secrets and unnecessary home-directory details.

## Exercise 2: Extend the smoke test

Create a standalone script that:

1. starts a local session with two worker threads;
2. creates integers 1–100;
3. retains multiples of 3;
4. groups them by remainder modulo 10;
5. calculates count and sum per remainder;
6. checks one expected result;
7. stops the session in a `finally` block.

### Prediction

Before running, name the action and likely shuffle. After running, attach a formatted plan.

### Hint

Use `spark.range`, `filter`, `withColumn`, and `groupBy().agg()`.

## Exercise 3: Troubleshooting drill

For each symptom—wrong Java version, inactive virtual environment, occupied Spark UI port, and a test that never exits—write:

- the first diagnostic command;
- expected evidence;
- the smallest corrective action;
- how you would verify recovery.

## Self-check

- Is PySpark exactly 4.2.0?
- Is the script repeatable from a fresh terminal?
- Does cleanup run after success and failure?
- Does the plan prediction match the observed plan?

## Stretch task

Run the same script with `local[1]`, `local[2]`, and `local[*]`. Explain why runtime on tiny data is not a valid cluster-scaling benchmark.
