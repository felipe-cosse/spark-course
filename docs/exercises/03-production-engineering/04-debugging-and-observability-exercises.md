# Exercises: Debugging and Observability

Source: [Debugging and observability](../../03-production-engineering/04-debugging-and-observability.md)

Estimated time: 90–135 minutes. Difficulty: intermediate to advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Observability | Inferring internal state from external evidence. |
| Error class | Structured category for a failure. |
| Straggler | A task substantially slower than stage peers. |
| Fetch failure | Failure to retrieve earlier shuffle output. |
| Runbook | Tested operational diagnosis and recovery procedure. |

## Exercise 1: Classify by layer

Classify each incident as contract, plan, Python worker, executor/JVM, storage/network, or orchestration:

- ambiguous column analysis error;
- one executor lost during shuffle;
- malformed decimal silently becoming null;
- external API throttling inside a UDF;
- expired workload credential;
- duplicated target after scheduler retry.

For each, name first evidence and one misleading action to avoid.

## Exercise 2: Create structured failure evidence

Trigger a missing-column error in a controlled test. Capture error condition/class, SQL state where available, message, run ID, and relevant schema. Re-raise the original exception.

### Requirement

The logging payload must not include full row data, credentials, or unnecessary paths.

## Exercise 3: Interpret task distributions

For three fictional stages—one straggler, all tasks spilling, and thousands of 100 ms tasks—write the likely hypotheses, metrics to compare, and next experiment.

## Exercise 4: Runbook

Write a decision-tree runbook for a job exceeding its 60-minute SLA. Include safe-retry checks, immediate mitigation, escalation bundle, restoration verification, and postmortem follow-up.

## Self-check

- Did diagnosis start from evidence rather than configuration guessing?
- Are correctness and resource failures both considered?
- Is original exception context preserved?
- Does the runbook avoid destructive first steps?

## Stretch task

Create a small intentionally faulty job and ask another learner to diagnose it using only your emitted metrics/logs and runbook.
