# Exercises: Schemas, Types, Nulls, and Time

Source: [Schemas and types](../../01-foundations/03-schemas-and-types.md)

Estimated time: 75–105 minutes. Difficulty: beginner to intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Precision | Total decimal digits permitted. |
| Scale | Decimal digits to the right of the decimal point. |
| Nullability | Whether a field may be missing or unknown. |
| Quarantine | A controlled invalid-record output with evidence. |
| Timezone | Named civil-time rules applied to timestamp interpretation. |

## Exercise 1: Design the contract

Define a `StructType` for an order event containing identifiers, UTC event timestamp, decimal amount, currency, customer struct, item array, tags, and free-form attributes map. Explain each nullability choice.

## Exercise 2: Valid and rejected outputs

Create raw string input covering valid data, blank ID, malformed timestamp, malformed amount, negative amount, unsupported currency, null status, and precision overflow.

Return two DataFrames:

- typed valid rows;
- raw rejected rows with `rejection_reasons: array<string>`.

### Requirements

Every source row must appear in exactly one output. A row may contain multiple rejection reasons.

### Hint

Keep raw columns beside parsed columns until classification is complete. Use `try_cast` where tolerant parsing is intentional.

## Exercise 3: Timezone boundary

Construct timestamps around a daylight-saving transition in `America/Los_Angeles`. Derive UTC timestamp, Los Angeles business date, and UTC date. Explain why a fixed `-08:00` offset is insufficient all year.

## Self-check

- Are money values never converted through `double`?
- Can you distinguish missing input from failed parsing?
- Are raw values preserved for rejected rows?
- Is the item-explosion output grain documented?

## Stretch task

Write schema-compatibility tests for adding a nullable field, changing decimal scale, and renaming a nested field. Classify each change for existing readers.
