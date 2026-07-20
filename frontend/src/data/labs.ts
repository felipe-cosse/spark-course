import type { LabDefinition } from "../types";

export const labs: LabDefinition[] = [
  {
    id: "setup_remainders",
    sourcePath: "/docs/00-getting-started/02-setup.md",
    exerciseNumber: 2,
    functionName: "remainder_counts",
    starter: `def remainder_counts(spark):
    """Return a DataFrame with columns remainder and count."""
    numbers = spark.range(0, 100)

    # TODO: calculate id % 10 as remainder, group, count, and sort.
    result = numbers
    return result


# Assign a DataFrame to result to preview its rows and physical plan.
result = remainder_counts(spark)`,
    criteria: [
      "Return exactly ten remainder groups (0 through 9).",
      "Each group contains ten values.",
      "Use Spark column expressions instead of collecting rows in Python.",
    ],
  },
  {
    id: "daily_operations",
    sourcePath: "/docs/01-foundations/02-sessions-and-first-dataframe.md",
    exerciseNumber: 2,
    functionName: "daily_metrics",
    starter: `def daily_metrics(orders):
    """Return one metrics row per order_date."""
    # Available columns: order_id, customer_id, ordered_at, status, amount
    # TODO: add order_date and aggregate complete/cancelled metrics.
    return orders


result = daily_metrics(orders)`,
    criteria: [
      "Produce one row per order date.",
      "Calculate complete count, customers, revenue, average value, and cancelled count.",
      "Keep revenue and average value as decimal values.",
    ],
  },
  {
    id: "valid_rejected",
    sourcePath: "/docs/01-foundations/03-schemas-and-types.md",
    exerciseNumber: 2,
    functionName: "validate_orders",
    starter: `def validate_orders(raw):
    """Return (valid_df, rejected_df) after parsing raw order strings."""
    # Columns: order_id, ordered_at_raw, amount_raw
    parsed = raw
    # TODO: parse the timestamp and decimal amount with try_* functions.
    # TODO: route invalid rows to rejected_df with a reason column.
    return parsed, parsed


valid_df, rejected_df = validate_orders(raw_orders)
result = valid_df`,
    criteria: [
      "Parse timestamp and amount into explicit target types.",
      "Keep valid rows separate from rejected rows.",
      "Attach a useful rejection reason without throwing away the raw values.",
    ],
  },
  {
    id: "rdd_totals",
    sourcePath: "/docs/01-foundations/04-rdds-and-shared-variables.md",
    exerciseNumber: 1,
    functionName: "purchase_totals",
    starter: `def purchase_totals(sc, purchases):
    """Return an RDD of (customer_id, total_amount) pairs."""
    # purchases contains (customer_id, amount) tuples.
    # TODO: parallelize, map to key/value pairs, and reduce by key.
    return sc.parallelize([])


result = purchase_totals(sc, purchases).toDF(["customer_id", "total_amount"])`,
    criteria: [
      "Aggregate purchases by customer with an RDD key operation.",
      "Return one pair per customer with the correct total.",
      "Do not collect before the aggregation.",
    ],
  },
  {
    id: "clean_customers",
    sourcePath: "/docs/02-dataframes-sql/01-transformations.md",
    exerciseNumber: 2,
    functionName: "clean_customers",
    starter: `def clean_customers(customers):
    """Normalize customer fields without changing the input DataFrame."""
    # Columns: customer_id, email, country, marketing_opt_in
    # TODO: trim/lower email, upper country, and normalize the boolean.
    return customers


result = clean_customers(customers)`,
    criteria: [
      "Normalize email and country with built-in functions.",
      "Convert common true/false strings to a Boolean column.",
      "Preserve one output row per input customer.",
    ],
  },
  {
    id: "customer_timeline",
    sourcePath: "/docs/02-dataframes-sql/02-aggregations-and-windows.md",
    exerciseNumber: 2,
    functionName: "customer_timeline",
    starter: `def customer_timeline(orders):
    """Add sequence, previous time, and running spend per customer."""
    # TODO: define an ordered customer window and a cumulative window.
    return orders


result = customer_timeline(orders)`,
    criteria: [
      "Sequence orders deterministically within each customer.",
      "Expose the previous order timestamp.",
      "Calculate a cumulative monetary total without collapsing rows.",
    ],
  },
  {
    id: "reconcile_orders",
    sourcePath: "/docs/02-dataframes-sql/03-joins.md",
    exerciseNumber: 3,
    functionName: "reconcile_orders",
    starter: `def reconcile_orders(source, target):
    """Return (source_only, target_only, changed) DataFrames."""
    # Both inputs contain order_id, status, and amount.
    # TODO: use anti joins for missing keys and compare matched rows.
    return source, target, source


source_only, target_only, changed = reconcile_orders(source_orders, target_orders)
result = changed`,
    criteria: [
      "Identify missing keys in both directions with anti joins.",
      "Identify status or amount differences for matched orders.",
      "Preserve evidence from both source and target in changed rows.",
    ],
  },
  {
    id: "parse_events",
    sourcePath: "/docs/02-dataframes-sql/04-storage-and-semi-structured-data.md",
    exerciseNumber: 2,
    functionName: "parse_events",
    starter: `def parse_events(events):
    """Parse payload JSON while preserving malformed records."""
    # Columns: event_id, payload
    payload_schema = "event_type string, user_id string, amount decimal(12,2)"
    # TODO: parse payload and split good/bad records.
    return events, events


valid_events, malformed_events = parse_events(events)
result = valid_events`,
    criteria: [
      "Parse JSON with an explicit schema.",
      "Flatten valid fields into a stable table.",
      "Retain the original payload for malformed records.",
    ],
  },
  {
    id: "quality_rules",
    sourcePath: "/docs/03-production-engineering/02-data-quality-and-idempotency.md",
    exerciseNumber: 1,
    functionName: "evaluate_quality",
    starter: `def evaluate_quality(orders):
    """Return one row of data-quality metrics."""
    # Columns: order_id, customer_id, amount, status
    # TODO: calculate total, null/invalid counts, duplicate keys, and valid rate.
    return orders


result = evaluate_quality(orders)`,
    criteria: [
      "Return a compact metrics DataFrame instead of collecting source rows.",
      "Measure required-field, domain, and duplicate-key failures.",
      "Calculate a valid-rate metric that can support a threshold decision.",
    ],
  },
];

const byExercise = new Map(
  labs.map((lab) => [`${lab.sourcePath}#${lab.exerciseNumber}`, lab]),
);

export function labFor(sourcePath: string, exerciseNumber: number): LabDefinition | undefined {
  return byExercise.get(`${sourcePath}#${exerciseNumber}`);
}
