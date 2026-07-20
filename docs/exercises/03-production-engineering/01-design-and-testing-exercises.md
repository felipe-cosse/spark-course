# Exercises: Production Design and Testing

Source: [Production design and testing](../../03-production-engineering/01-design-and-testing.md)

Estimated time: 100–140 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Orchestration | Coordination of I/O, transformations, checks, publication, and recovery. |
| Unit test | A focused test of one small behavior without external systems. |
| Integration test | A test crossing a real system/format boundary. |
| Fixture | Controlled input and expected data used by a test. |
| Invariant | A property that must remain true across valid inputs. |

## Exercise 1: Refactor a monolithic job

Take or invent a script that creates a session, reads files, cleans data, aggregates, prints counts, and writes output in one function. Refactor it into:

- pure transformation functions;
- explicit quality checks;
- I/O adapters;
- one orchestration entry point.

### Deliverable

Before/after structure and a dependency diagram showing which layer may call actions.

## Exercise 2: Test edge cases

Write pytest tests for a completed-order metrics function using explicit schemas. Cover normal input, empty input, null amount, decimal precision, duplicate ID, and cancelled-only date.

Use `assertDataFrameEqual` and `assertSchemaEqual`. Do not compare formatted `show()` text.

## Exercise 3: Test invariants

Implement at least three invariant tests:

- cleaning twice equals cleaning once;
- accepted plus rejected counts equals input count;
- a many-to-one enrichment preserves left row count;
- grouped revenue equals contributing input revenue.

### Hint

Put actions in the test/assertion boundary, not inside the transformation under test.

## Self-check

- Can logic be tested without reading/writing files?
- Does the empty fixture have an explicit schema?
- Are types tested separately from values?
- Do tests include deterministic tie behavior?

## Stretch task

Add one integration test that writes and reads a temporary Parquet output, verifying schema, partition column, and safe cleanup without using a broad destructive path.
