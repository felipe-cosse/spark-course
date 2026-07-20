# Exercises: Troubleshooting Decision Practice

Source: [Troubleshooting decision tree](../../reference/troubleshooting.md)

Estimated time: 90–135 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Symptom | Visible failure or degradation. |
| Hypothesis | Testable possible explanation. |
| Evidence | Observation supporting or contradicting a hypothesis. |
| Mitigation | Immediate impact-reduction action. |
| Root cause | Underlying condition that enabled the failure. |

## Exercise 1: Evidence-first diagnosis

For each symptom—wrong total, driver OOM, executor OOM, fetch failure, missing file, streaming backlog, and incompatible checkpoint—write three hypotheses, discriminating evidence, and one unsafe premature action.

## Exercise 2: Task-pattern cards

Create incident cards for:

- one 40-minute task among 2,000 fast tasks;
- every task spilling and spending high time in GC;
- 100,000 subsecond tasks with high scheduler delay;
- all tasks waiting on a throttled sink.

Write likely layer, next metric, smallest experiment, and verification.

## Exercise 3: Escalation bundle

Assemble a mock escalation containing application/run ID, artifact/config, exact error, plan, stage/task evidence, safe-retry state, data scope, impact, and changes since last success. Remove secrets and personal data.

## Exercise 4: Recovery review

Given a proposed fix of deleting a streaming checkpoint, write the questions/evidence required before any migration. Propose safer in-place or versioned alternatives.

## Self-check

- Does every change follow evidence?
- Are restoration and root-cause work separated?
- Is data correctness verified after recovery?
- Are destructive actions absent from first response?

## Stretch task

Facilitate a tabletop incident: one person reveals evidence only when another asks the correct diagnostic question. Debrief which questions narrowed the search fastest.
