# Deployment, Security, and Cost

## Key terms on this page

| Term | Definition |
|---|---|
| `spark-submit` | Spark's command-line tool for launching an application with code, arguments, and configuration. |
| Deploy mode | Whether the driver runs near the submitting client or inside the cluster environment. |
| Artifact | An immutable packaged output of a build, such as a Python archive or container image. |
| Executor core | A unit of executor CPU concurrency; it influences the number of tasks an executor can run together. |
| Dynamic allocation | Automatic adjustment of executor count based on workload demand and platform support. |
| Workload identity | A non-human identity assigned to an application for authenticated resource access. |
| Least privilege | Granting only the permissions required for a specific workload and scope. |
| Encryption in transit | Protection of data while it travels over a network. |
| SLO | Service-level objective: a measurable reliability or performance target. |
| Unit cost | Resource cost normalized by useful output, such as cost per processed terabyte. |
| Rollback | A controlled return to a previously known-good artifact or data publication. |

## Package an application

A production entry point should accept configuration, create or receive the session, run one bounded unit of work, and return a meaningful exit status.

```bash
spark-submit \
  --master k8s://https://cluster.example \
  --deploy-mode cluster \
  --name orders-daily \
  --conf spark.sql.session.timeZone=UTC \
  --conf spark.sql.adaptive.enabled=true \
  --py-files dist/orders_pipeline.zip \
  jobs/orders_daily.py \
  --run-date 2026-07-20 \
  --environment production
```

Read the submission in three layers. The first four options select the cluster, driver placement, and application identity. `--conf` supplies environment policy without hard-coding it into transformations. `--py-files` distributes the packaged Python modules, while `jobs/orders_daily.py` is the driver entry point. Everything after that is application-specific input. A real production command should be generated from reviewed configuration and must not expose secrets in arguments or UI-visible settings.

This is illustrative; cluster URLs, images, dependencies, authentication, and storage connectors are environment-specific.

## Dependency strategies

- build a tested container image for Kubernetes environments;
- distribute Python code with `--py-files` for lightweight packages;
- use Conda, virtualenv archives, PEX, or `uv run` according to the official package-management guidance and platform capabilities;
- ensure native dependencies and Python versions match executors, not only the driver.

Pin and scan dependencies. Record the artifact digest with every run.

## Resource reasoning

Executor sizing is a trade-off among parallelism, per-task memory, garbage collection, Python worker overhead, and failure blast radius. Start from workload evidence:

- concurrent tasks per executor roughly follow executor cores;
- each task needs enough memory for its partition and operator state;
- Python processes may consume memory outside the JVM heap;
- dynamic allocation changes capacity over time but does not eliminate skew;
- more cores per executor can increase concurrent memory pressure.

Load-test production-like data before setting autoscaling or timeout policies.

As a concrete example, an executor with five cores may run five tasks concurrently. If each join task can require 2 GB of execution/Python memory, that executor may need substantially more than 10 GB after JVM, cache, overhead, and safety margin are considered. Reducing cores per executor can lower concurrent pressure even when total cluster cores stay constant. This is why executor memory cannot be chosen independently from task size and executor concurrency.

## Security baseline

- Run Spark only on a trusted network and enable platform-supported authentication and encryption.
- Use workload identities/roles and least privilege; do not ship personal credentials.
- Keep secrets out of source, command-line arguments, Spark configuration displayed in UIs, and logs.
- Encrypt network traffic and storage according to the data classification.
- Restrict Spark UI, history server, logs, event logs, and checkpoints; they can expose paths, queries, schemas, or data samples.
- Validate user-controlled paths, SQL identifiers, and configuration against allowlists.
- Patch Spark, Java, Python, connectors, and base images under an owned process.

Spark's own security documentation warns that security features are not necessarily enabled by default. The deployment platform must provide a complete boundary.

## Cost is an engineering metric

Measure cost per successful unit such as dollars per processed TB, per million events, or per completed partition—not only cluster uptime.

Cost drivers include:

- scanning data that filters or partition pruning could avoid;
- shuffles and repeated computations;
- idle or overprovisioned resources;
- small-file listing and request overhead;
- inefficient compression or serialization;
- repeated failed/retried jobs;
- retention of checkpoints, intermediate outputs, and logs;
- external egress and cross-zone/network transfers.

## Release checklist

- Transformation and integration tests pass.
- Input/output contracts and compatibility are reviewed.
- Artifact and dependencies are immutable.
- Identity has only required source, target, catalog, checkpoint, and log permissions.
- Retry and rollback behavior is tested.
- Metrics, alerts, ownership, and runbook exist.
- Backfill and concurrent-run behavior are documented.
- Resource and cost limits are defined.

## Work task: deployment review

Prepare a deployment design for a 2 TB/day order pipeline with a 45-minute SLA and a seven-day backfill requirement.

### Acceptance criteria

- Driver and executor responsibilities inform sizing.
- Dependency distribution works on every executor.
- Credentials are workload-scoped and absent from code/config logs.
- Retry, backfill concurrency, observability, and cost limits are explicit.
- The plan states what must be tested in the actual platform.

References: [Submitting applications](https://spark.apache.org/docs/4.2.0/submitting-applications.html), [Security](https://spark.apache.org/docs/4.2.0/security.html), [Running on Kubernetes](https://spark.apache.org/docs/4.2.0/running-on-kubernetes.html), and [Python package management](https://spark.apache.org/docs/4.2.0/api/python/tutorial/python_packaging.html).

## Exercises

Complete the [deployment, security, and cost exercises](../exercises/03-production-engineering/05-deployment-security-and-cost-exercises.md).
