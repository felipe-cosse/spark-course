# Exercises: Storage and Semi-structured Data

Source: [Storage, file layout, and semi-structured data](../../02-dataframes-sql/04-storage-and-semi-structured-data.md)

Estimated time: 90–120 minutes. Difficulty: intermediate.

## Key terms reinforced

| Term | Definition |
|---|---|
| Columnar format | Storage organized by columns for analytical pruning/compression. |
| Storage partition | Directory/table subdivision based on column values. |
| Partition pruning | Skipping storage partitions that cannot match a filter. |
| Small-file problem | Metadata and scheduling overhead from excessive tiny files. |
| Schema evolution | Controlled change to stored fields and types over time. |

## Exercise 1: Format decision

Choose a format for each workload: raw API events, curated finance facts, Kafka-compatible row messages, analyst CSV export, and long-lived Hive-oriented tables. Justify typing, read pattern, compression, evolution, and interoperability.

## Exercise 2: Parse nested events

Build JSON strings with nested customer, item array, attribute map, malformed payload, empty items, and unknown field. Parse once with an explicit schema and produce:

- one accepted event row per payload;
- one item row per item using `explode_outer`;
- rejected raw payloads with reasons.

Explain the grain and empty-array behavior of each output.

## Exercise 3: Partition-pruning experiment

Write a small Parquet dataset partitioned by date. Read one date and inspect `PartitionFilters` in the plan. Repeat with a filter expression that may obscure pruning, then rewrite it into a direct range/equality predicate.

## Exercise 4: File-layout design

For a workload varying from 10–600 GB/day, propose partition columns, target file-size range, writer partitioning, compaction trigger, late-data behavior, and concurrent-writer protocol.

## Self-check

- Did you separate execution partitions from storage partitions/files?
- Are high-cardinality IDs excluded from directory partitioning?
- Is malformed raw evidence preserved?
- Does the write design identify transactional capabilities accurately?

## Stretch task

Create many tiny local files and compare plan/task overhead with a compacted output. Report file count and plan evidence, not only wall-clock time.
