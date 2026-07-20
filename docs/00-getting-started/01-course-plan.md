# Course Plan and Learning Paths

## Key terms on this page

| Term | Definition |
|---|---|
| Prerequisite | Knowledge or skill expected before starting a learning activity. |
| Learning path | An ordered selection of modules designed for a particular goal or role. |
| Work product | A concrete artifact—such as code, a diagram, or a runbook—that demonstrates applied learning. |
| Assessment | A method for evaluating whether a learner can explain or perform an objective. |
| Data grain | The real-world meaning of one row in a dataset, such as one row per order. |
| Acceptance criteria | Observable conditions that a solution must satisfy to be considered complete. |
| Invariant | A rule that should remain true for every valid input or execution, not only for one example. |
| Capstone | A final project that integrates course concepts into a realistic system. |

This page helps you choose both a sequence and a pace. Do not treat the weekly table as a checklist of reading. Each “work product” is evidence that you can use the concept, so spend more time on producing and reviewing the artifact than on memorizing method names.

## Audience and prerequisites

You should be comfortable with Python functions, collections, exceptions, and package environments, and know basic SQL (`SELECT`, `WHERE`, `GROUP BY`, and joins). Linux shell and Git experience help in the production modules. No distributed-systems background is required.

## Recommended 14-week path

| Week | Focus | Work product |
|---|---|---|
| 1 | Setup and distributed execution | Annotated job/stage/task diagram |
| 2 | Sessions, DataFrames, schemas | Typed ingestion exercise |
| 3 | Columns and transformations | Reusable cleaning function |
| 4 | Aggregations and windows | Customer KPI table |
| 5 | Joins and data modeling | Join contract and duplicate-key analysis |
| 6 | File formats, tables, SQL | Partitioned Parquet dataset |
| 7 | Code design and tests | Unit-tested transformation package design |
| 8 | Data quality and idempotency | Contract checks and safe-rerun plan |
| 9 | Query plans and tuning | Before/after performance memo |
| 10 | Debugging, observability, deployment | Job runbook |
| 11 | Streaming model and event time | Stateful rate-source lab |
| 12 | Production streaming | Recovery and replay design |
| 13 | Spark 4.2 advanced APIs and MLlib | API decision record |
| 14 | Real-world case and capstone review | Architecture, code, tests, and demo |

At 5–7 hours per week, this is roughly 80 hours. Teams can convert each “work task” into a code review or pair-programming session.

## Role-based shortcuts

### Data engineer

Complete all foundations, DataFrames/SQL, production engineering, streaming, and one capstone. Spend extra time on join contracts, idempotency, physical plans, checkpoint ownership, deployment, and incident response.

### Analytics engineer

Prioritize schemas, transformations, aggregations, joins, storage, SQL/catalogs, testing, and the batch ETL case. Read streaming for architectural literacy.

### Data scientist or ML engineer

Prioritize DataFrames, aggregations/windows, joins, Arrow/pandas, performance boundaries, and MLlib Pipelines. Complete the batch capstone with a feature-engineering extension.

### Platform or SRE engineer

Read foundations, then focus on performance, debugging, deployment/security/cost, production streaming, and the performance incident. Your capstone deliverable can be an operating model rather than new business transformations.

## Assessment model

The course uses evidence rather than trivia:

- **Concept checks (20%)** — explain a plan, predict a shuffle, or select an API.
- **Labs (30%)** — small, runnable exercises with acceptance criteria.
- **Work cases (20%)** — tickets, incidents, design reviews, and runbooks.
- **Capstone (30%)** — correctness, performance reasoning, operability, and communication.

Do not grade code only on whether it produces a result. A strong solution also states the grain of every dataset, handles nulls and duplicates deliberately, avoids unbounded driver collection, can be rerun safely, exposes useful metrics, and explains its performance assumptions.

For example, two programs may calculate the same daily revenue on a clean sample. The stronger program also rejects malformed money, detects duplicate order IDs, uses a deterministic business date, and proves that a retry cannot add the revenue twice. The assessment therefore rewards reasoning and operational behavior in addition to output values.

## Recurring business dataset

Most examples use a small commerce model:

- `orders`: one row per order, with customer, timestamp, status, and total;
- `order_items`: one row per product within an order;
- `customers`: one current row per customer unless a history exercise says otherwise;
- `events`: append-only user or payment events with an event timestamp and event ID;
- `products`: one row per product.

Always state the **grain** before transforming or joining a dataset. Many production “Spark problems” are actually grain or data-contract mistakes.

## Definition of course completion

You are finished when you can independently:

1. turn a vague data request into input/output contracts and measurable acceptance criteria;
2. implement it with DataFrame or SQL expressions and tests;
3. read the logical and physical plan and identify expensive boundaries;
4. describe retry, replay, idempotency, and late-data behavior;
5. write a short runbook another engineer can use during an incident.

Continue with [local setup](02-setup.md).

## Exercises

Complete the [course-planning exercises](../exercises/00-getting-started/01-course-plan-exercises.md).
