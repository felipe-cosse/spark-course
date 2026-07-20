# Exercises: Sources and Research Practice

Source: [References and source notes](../../reference/references.md)

Estimated time: 60–90 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Normative source | Authority followed when technical sources disagree. |
| Primary source | Original project documentation, code, specification, or research. |
| Versioned documentation | Documentation fixed to a named release. |
| Migration guide | Record of behavior and compatibility changes between versions. |
| Provider-specific advice | Guidance tied to one managed platform's implementation/defaults. |

## Exercise 1: Source hierarchy

For a question about Python support, a DataFrame method signature, Kafka retention, Dataproc autoscaling, and Spark 4.2 Arrow defaults, identify the best primary/normative source and explain why.

## Exercise 2: Resolve a disagreement

Find an older tutorial or book example whose API/default differs from Spark 4.2. Compare it with the official migration/API documentation and write a correction note with version scope.

## Exercise 3: Provider translation

Choose one AWS, Google Cloud, or Databricks tuning recommendation. Separate general Spark principle, provider default, provider-specific capability, and verification needed on another platform.

## Self-check

- Are claims tied to the correct release?
- Did you prefer primary official sources for technical behavior?
- Are provider defaults prevented from becoming universal claims?
- Are copied examples tested against 4.2 semantics?

## Stretch task

Create a maintenance issue template for upgrading the course to a future Spark release, including dependencies, migrations, example execution, streaming compatibility, and link review.
