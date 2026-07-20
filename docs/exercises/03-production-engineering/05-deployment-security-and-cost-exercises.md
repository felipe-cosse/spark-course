# Exercises: Deployment, Security, and Cost

Source: [Deployment, security, and cost](../../03-production-engineering/05-deployment-security-and-cost.md)

Estimated time: 100–150 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Artifact | Immutable packaged output of a build. |
| Deploy mode | Location where the Spark driver runs relative to the cluster. |
| Workload identity | Non-human identity used by an application. |
| Least privilege | Only the permissions required for the exact workload scope. |
| Unit cost | Resource cost normalized by useful processed output. |

## Exercise 1: Submission review

Write a provider-neutral `spark-submit` command for a packaged daily job. Include driver entry point, Python artifact, application arguments, timezone, AQE, and deployment selection. Annotate which settings belong in platform policy rather than source code.

## Exercise 2: Resource estimate

Given 2 TB input, a 45-minute SLO, 200 worker cores, and a join whose typical task needs 1.5 GB but p99 needs 4 GB, propose initial executor cores/memory and shuffle partition reasoning. State assumptions and load tests needed before production.

### Hint

Reason about concurrent task memory per executor, JVM/Python overhead, skew, and task-size distribution. There is no single numeric answer without assumptions.

## Exercise 3: Security boundary review

Create a trust-boundary diagram for driver, executors, object storage, catalog, checkpoints, logs/UI, and orchestration. Assign workload identity permissions and classify where secrets or sensitive data could leak.

## Exercise 4: Cost scorecard

Define cost per processed TB and at least five driver metrics: bytes scanned, shuffle bytes, failed retries, file count, idle time, and output volume. Explain how a faster job could still cost more.

## Self-check

- Are artifacts and dependencies immutable/pinned?
- Are secrets absent from code, arguments, logs, and visible configuration?
- Does sizing connect task memory with concurrency?
- Are rollback and backfill included in release planning?

## Stretch task

Conduct a release review using the course checklist and write three findings in evidence–risk–recommendation–verification format.
