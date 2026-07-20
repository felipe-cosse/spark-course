# Exercises: Performance Incident

Source: [The 3 A.M. performance incident](../../06-real-world-cases/04-performance-incident.md)

Estimated time: 2–3 hours. Difficulty: advanced incident response.

## Key terms reinforced

| Term | Definition |
|---|---|
| Straggler | A task much slower than stage peers. |
| Hot key | A key with disproportionately high frequency. |
| Mitigation | Immediate reduction of incident impact. |
| Root cause | Underlying condition enabling failure. |
| Salting | Secondary key used to distribute one hot key. |

## Exercise 1: First 15 minutes

Write the exact first ten checks for the incident. Include job identity, publish state, retry safety, SQL operator, task distribution, key frequency, join cardinality, and recent changes. Explain why adding memory is not first.

## Exercise 2: Evidence discrimination

For sentinel-key skew, duplicate dimension, corrupt large file, and lost executor, list evidence that would distinguish each from the others.

## Exercise 3: Controlled remediation

Choose one confirmed cause and write a before/after experiment. Include representative input, one change, plan/stage metrics, correctness reconciliation, cost, and rollback.

## Exercise 4: Communications

Write:

- a 100-word executive update with impact, status, mitigation, and next update;
- a technical note with evidence, mechanism, fix, and verification;
- one prevention action with owner and due date.

## Self-check

- Did you separate correctness multiplication from performance skew?
- Does the proposed change match observed evidence?
- Are additive and distinct metrics treated correctly under salting?
- Is output validated before publication?

## Stretch task

Define alerts using maximum/median task duration, hot-key share, and projected SLA completion. Explain how to avoid noisy alerts from normal variance.
