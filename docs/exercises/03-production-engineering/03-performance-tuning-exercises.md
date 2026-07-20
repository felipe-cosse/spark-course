# Exercises: Performance Tuning

Source: [Performance tuning from evidence](../../03-production-engineering/03-performance-tuning.md)

Estimated time: 120–180 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Baseline | Reference measurement before a change. |
| Bottleneck | The resource/operation limiting throughput or runtime. |
| Exchange | A physical redistribution operator. |
| AQE | Runtime plan adaptation using observed statistics. |
| Spill | Execution data moved from memory to disk. |

## Exercise 1: Read a physical plan

Build a filter–join–aggregate pipeline. Annotate scans, filters, exchanges, join strategy, aggregate phases, and output partitioning in its formatted plan.

### Deliverable

The plan plus a one-page explanation connecting operators to expected stages.

## Exercise 2: Controlled experiment

Create a baseline with representative local fixture shape. Choose exactly one change:

- prune columns earlier;
- apply a direct pushdown-friendly filter;
- replace a Python UDF with built-ins;
- alter justified partitioning;
- safely broadcast a measured small dimension.

Compare output equality, plan, runtime, shuffle, and task evidence. Do not make a second change in the same experiment.

## Exercise 3: Cache decision

Construct an expensive intermediate used by two downstream actions. Compare no cache, `MEMORY_AND_DISK`, and materialized temporary output. Explain reuse count, cache population action, memory pressure, cleanup, and when recomputation is cheaper.

## Exercise 4: Diagnose skew

Create a controlled hot-key dataset. Measure key share and partition sizes. Propose invalid-key separation, AQE, broadcast, or salting in increasing complexity order.

## Self-check

- Was the baseline captured before tuning?
- Did one evidence-backed hypothesis drive one change?
- Was correctness compared after the change?
- Are local measurements described as local rather than production proof?

## Stretch task

Write a performance memo suitable for review: context, SLO, evidence, hypothesis, experiment, results, cost effect, risks, and rollback.
