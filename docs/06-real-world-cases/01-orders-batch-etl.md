# Workplace Case: Production Orders ETL

## Key terms on this page

| Term | Definition |
|---|---|
| ETL | Extract, transform, load: reading source data, applying rules, and publishing target data. |
| Curated dataset | A validated, typed, documented dataset intended for trusted downstream use. |
| Dimension | Reference data that describes business entities such as customers or currencies. |
| Source manifest | A durable inventory of source objects and immutable identities included in a run. |
| Current state | The latest valid representation of each business entity after ordered changes are applied. |
| Terminal state | A status after which only explicitly allowed transitions or corrections may occur. |
| Late data | Source data arriving after its expected processing period. |
| Reconciliation | Proof that records and measures balance across source, rejected, curated, and summary outputs. |
| Source-to-target mapping | Documentation of how each input field/rule produces each target field. |
| Publish protocol | The controlled process that validates and exposes new output to consumers. |

## Ticket

Build a daily curated orders dataset and a finance summary from raw JSON events. The job must finish within 45 minutes for 2 TB/day, tolerate malformed records, handle duplicate updates, and support a seven-day late-data window.

Approach this case as a sequence of contracts, not as one large code block. Begin with three paper examples: a normal order, a malformed event, and an order corrected two days later. For each, write which outputs change and which metrics reconcile. Only then design transformations. This prevents an implementation from silently choosing semantics for duplicates, time, or money.

## Inputs

- Append-only JSON files partitioned by ingestion date/hour.
- Events contain `order_id`, `customer_id`, `event_type`, `event_time`, `updated_at`, `amount`, `currency`, `status`, and `items`.
- The same logical update may be resent. Later updates may correct status or amount.
- Customer and currency-rate dimensions are catalog tables.

## Required outputs

1. `curated.orders_current`: one latest valid row per order.
2. `finance.daily_order_summary`: one row per business date and settlement currency.
3. `quarantine.order_events`: raw evidence plus all rejection reasons.
4. Run metrics and reconciliation status.

## Design sequence

### 1. State contracts

- Event grain: one source update per immutable event ID.
- Current-order grain: one row per order ID.
- Summary grain: one row per business date and currency.
- Valid status transitions and terminal-state behavior.
- Currency-rate effective-date semantics.

### 2. Read only the affected scope

For run date `D`, read new ingestion partitions plus any replay scope identified by the source ledger. Do not scan the whole history merely because late data can affect seven dates.

For example, if a file arriving on July 20 corrects an order whose business date is July 18, the read scope includes the new file, while the write/publish scope includes the affected July 18 current/summary data. “What arrived today” and “which business partitions must change” are different sets.

### 3. Parse and classify

Preserve source URI, ingestion partition, source modification metadata or manifest identity, raw payload, parser version, and run ID. Route malformed JSON and business-rule failures with reason arrays.

### 4. Deduplicate deterministically

First deduplicate immutable event IDs. Then select the latest order state using the domain ordering, for example `updated_at`, source sequence, ingestion timestamp, and event ID as stable tie-breakers. Do not assume ingestion order equals business order.

### 5. Join dimensions under contracts

- Currency rates must be unique at their effective date/currency grain.
- Customers may require an as-of join if historical attributes matter.
- Unmatched required dimensions are rejected or held; optional dimensions are measured.

### 6. Publish safely

Use the transactional table provider's atomic upsert/partition replacement when available. With plain files, stage a complete affected partition set, validate it, and publish through an environment-supported atomic metadata switch. Never mix partial new files into trusted output.

### 7. Reconcile

For the affected scope, compare:

- input events = accepted events + rejected events;
- unique event IDs after deduplication;
- expected current-order changes;
- source/curated amount totals under documented status rules;
- summary totals = curated contributing totals;
- unmatched dimensions and late-event counts.

## Suggested transformation boundary

```python
def build_current_orders(events, prior_orders):
    """Return the intended current state for affected order IDs; no I/O or actions."""
    ...

def build_daily_summary(current_orders, rates):
    """Return one row per business date and settlement currency."""
    ...
```

The first function receives both new event interpretation and prior current state because it must decide the intended state for affected order IDs. The second function operates only on validated current orders and rates, so finance logic cannot accidentally count quarantined events. The ellipses are a design exercise: define schemas, grains, and deterministic ordering before filling in expressions.

Test the boundary with an order that changes from `PENDING` amount 10.00 to `COMPLETE` amount 12.00. The current output should contain one 12.00 row, while the audit/accepted-event layer retains both valid changes. The daily summary should contribute 12.00 once—not 22.00 and not two orders.

Transformation functions should not know source paths, checkpoint locations, table credentials, or retry count.

## Operational metrics

- files/events read and skipped by the ledger;
- parse and business-rejection counts by reason;
- duplicate events and duplicate order-update ties;
- late events by days late;
- affected orders and partitions;
- dimension-match rates;
- source, curated, and summary monetary reconciliations;
- duration, shuffle bytes, spill, file counts, and cost unit.

## Learner deliverables

1. Source-to-target mapping and grain diagram.
2. PySpark transformation functions and unit tests.
3. Write/publish protocol for the chosen storage system.
4. Query plan and performance budget.
5. Runbook for partial failure and late correction.

## Acceptance criteria

- Rerunning the same run does not duplicate logical output.
- Same-timestamp updates are deterministic.
- Raw evidence survives rejection.
- Currency conversion uses the correct effective date and decimal rules.
- Summary reconciles to curated data.
- A failed run cannot expose a partially trusted partition.
- The design does not claim plain Parquet supplies transactions.

## Exercises

Complete the [Production Orders ETL case exercises](../exercises/06-real-world-cases/01-orders-batch-etl-exercises.md).
