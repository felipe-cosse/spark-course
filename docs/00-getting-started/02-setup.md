# Local Setup for PySpark 4.2

## Key terms on this page

| Term | Definition |
|---|---|
| Runtime | The software environment that executes a program, including language and system dependencies. |
| JDK | Java Development Kit; Spark needs a compatible Java runtime even when the application is written in Python. |
| Virtual environment | An isolated Python package environment that prevents one project's dependencies from changing another's. |
| Dependency | A library or runtime component that an application requires. |
| Package extra | An optional dependency group installed with syntax such as `pyspark[sql]`. |
| SparkSession | The main entry point for DataFrame, SQL, catalog, and streaming operations. |
| Local mode | Spark execution on one computer, useful for learning and tests but different from a multi-node cluster. |
| Spark UI | The web interface that exposes jobs, stages, tasks, storage, SQL plans, and executor activity. |

The setup has two goals: reproducibility and useful failure isolation. Checking Python and Java first separates runtime problems from Spark-code problems; using a virtual environment then makes the installed PySpark version explicit and repeatable.

## Requirements

Spark 4.2.0's PySpark installation guide requires Python 3.10 or newer and Java 17 or newer. Confirm both before debugging Spark itself:

```bash
python3 --version
java -version
```

Create an isolated environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "pyspark[sql]==4.2.0" pytest
```

Optional modules are installed only when you reach them:

```bash
# pandas API on Spark and plotting
python -m pip install "pyspark[pandas_on_spark]==4.2.0" plotly

# Spark Connect client and its dependencies
python -m pip install "pyspark[connect]==4.2.0"

# Spark Declarative Pipelines
python -m pip install "pyspark[pipelines]==4.2.0"
```

Do not mix a Conda-managed PySpark with a pip-managed PySpark in the same environment. Pin the course version so examples do not silently change after a new release.

## Smoke test

Start the shell:

```bash
pyspark
```

Then run:

```python
import pyspark.sql.functions as F

result = (
    spark.range(1, 6)
    .withColumn("squared", F.col("id") ** 2)
    .agg(F.sum("squared").alias("sum_of_squares"))
)
result.show()
assert result.first()["sum_of_squares"] == 55
```

Read the smoke test from inside out:

1. `spark.range(1, 6)` creates the values 1 through 5; the upper bound is excluded.
2. `withColumn` describes a new `squared` column but does not execute yet.
3. `agg(sum(...))` changes the output to one summary row.
4. `show()` triggers one execution so you can inspect the row.
5. `first()` is another action and may trigger the plan again because the result was not cached.
6. The assertion converts the visible result into an automated correctness check: `1 + 4 + 9 + 16 + 25 = 55`.

The repeated action is acceptable for a five-row smoke test. In a real job, avoid repeating expensive actions merely to print and then validate the same result.

Exit with `spark.stop()` and `exit()`.

For a standalone script, create a session explicitly:

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("course-smoke-test")
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)

assert spark.version == "4.2.0"
assert spark.range(10).count() == 10
spark.stop()
```

Here the builder records local execution, an application name, and four shuffle partitions. `getOrCreate()` starts or reuses a compatible session. `count()` is the first action and proves that executor-side work can complete. `spark.stop()` releases the local Spark context; omitting it is a common reason tests or scripts appear to hang after their useful work finishes.

`local[*]` uses all logical cores. The low shuffle-partition setting is suitable for tiny labs, not a production default.

## Choose an interface

| Interface | Best for | Important behavior |
|---|---|---|
| `pyspark` shell | Fast API exploration | Creates `spark` automatically |
| Notebook | Narrative analysis and teaching | Restart sessions to expose hidden state |
| Python + `spark-submit` | Repeatable applications | Mirrors production entry points |
| Spark Connect client | Remote application architecture | No `SparkContext` or RDD API |

The core course works with classic PySpark. Spark Connect is covered later because its client/server boundary changes debugging, dependency, and API decisions.

## Useful local settings

```python
spark.sparkContext.setLogLevel("WARN")
spark.conf.set("spark.sql.session.timeZone", "UTC")
```

Use UTC for course timestamp exercises. A real business may require a presentation timezone, but storage and processing semantics should be explicit.

Open the Spark UI at `http://localhost:4040` while an application is running. If multiple Spark contexts are active, ports increment to `4041`, `4042`, and so on.

## Setup troubleshooting

| Symptom | First check |
|---|---|
| `[JAVA_GATEWAY_EXITED]` | `java -version`, `JAVA_HOME`, and whether Java is 17+ |
| `ModuleNotFoundError: pyspark` | The active Python interpreter and `python -m pip show pyspark` |
| Version is not 4.2.0 | Remove conflicting environments; inspect `pyspark.__file__` |
| Bind or hostname error | Local hostname resolution and `SPARK_LOCAL_IP=127.0.0.1` for a local-only lab |
| Port 4040 unavailable | Look at 4041+ or stop stale local sessions |
| Tests never exit | Ensure the fixture or test suite calls `spark.stop()` |

## Lab: environment evidence

Produce a short Markdown note containing:

- Python, Java, and PySpark versions;
- the result of the sum-of-squares smoke test;
- the Spark UI Jobs page URL you observed;
- one difference between local mode and a multi-node cluster.

### Acceptance criteria

- The PySpark version is exactly 4.2.0.
- The sum is 55.
- The note distinguishes a driver from an executor; it does not claim that `local[*]` is a cluster.

Sources: [PySpark installation](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html) and [PySpark quickstart](https://spark.apache.org/docs/4.2.0/quick-start.html).

## Exercises

Complete the [local-setup exercises](../exercises/00-getting-started/02-setup-exercises.md).
