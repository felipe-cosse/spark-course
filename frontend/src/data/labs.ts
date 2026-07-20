import type { LabDefinition } from "../types";

export const labs: LabDefinition[] = [
  {
    id: "setup_remainders",
    sourcePath: "/docs/00-getting-started/02-setup.md",
    exerciseNumber: 2,
    functionName: "remainder_counts",
    starter: `def remainder_counts(spark):
    """Return count and sum by remainder for multiples of 3 from 1 through 100."""
    numbers = spark.range(1, 101)

    # TODO: keep multiples of 3, calculate id % 10, then aggregate.
    result = numbers
    return result


# Assign a DataFrame to result to preview its rows and physical plan.
result = remainder_counts(spark)`,
    criteria: [
      "Return exactly ten remainder groups (0 through 9).",
      "Aggregate only the 33 multiples of 3 from 1 through 100.",
      "Return both count and sum for every remainder.",
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
      "Calculate complete count, customers, revenue, average value, cancelled count, and cancellation rate.",
      "Keep revenue and average value as decimal values.",
    ],
  },
  {
    id: "valid_rejected",
    sourcePath: "/docs/01-foundations/03-schemas-and-types.md",
    exerciseNumber: 2,
    functionName: "validate_orders",
    starter: `def validate_orders(raw):
    """Return typed valid rows and raw rejected rows with all reasons."""
    # Columns: order_id, ordered_at_raw, amount_raw, currency, status
    parsed = raw
    # TODO: parse the timestamp and decimal amount with try_* functions.
    # TODO: build rejection_reasons: array<string> for every applicable rule.
    return parsed, parsed


valid_df, rejected_df = validate_orders(raw_orders)
result = valid_df`,
    criteria: [
      "Parse timestamp and amount into explicit target types.",
      "Classify blank IDs, malformed values, negatives, unsupported currency, null status, and overflow.",
      "Make valid and rejected outputs mutually exclusive and exhaustive.",
      "Retain every applicable rejection reason and all raw evidence.",
    ],
  },
  {
    id: "rdd_totals",
    sourcePath: "/docs/01-foundations/04-rdds-and-shared-variables.md",
    exerciseNumber: 1,
    functionName: "purchase_totals",
    starter: `def purchase_totals_grouped(sc, purchases):
    """Return totals calculated with groupByKey."""
    return sc.parallelize([])


def purchase_totals(sc, purchases):
    """Return an RDD of (customer_id, total_amount) pairs."""
    # TODO: calculate the same totals with reduceByKey.
    return sc.parallelize([])


result = purchase_totals(sc, purchases).toDF(["customer_id", "total_amount"])`,
    criteria: [
      "Implement both groupByKey and reduceByKey versions.",
      "Prove both versions return the same customer totals.",
      "Explain why reduceByKey usually sends less data across the network.",
      "Do not collect before the aggregation.",
    ],
  },
  {
    id: "clean_customers",
    sourcePath: "/docs/02-dataframes-sql/01-transformations.md",
    exerciseNumber: 2,
    functionName: "clean_customers",
    starter: `def clean_customers(customers):
    """Normalize nested customer data and attach explicit quality flags."""
    # Columns: customer_id, name, email, phone, preferences_json, tags
    # TODO: normalize scalar fields, parse preferences, normalize tags,
    # create quality_flags, and return an intentional selected schema.
    return customers


result = clean_customers(customers)`,
    criteria: [
      "Trim IDs/names and normalize email and phone with built-in functions.",
      "Parse preference JSON into a struct.",
      "Normalize and deduplicate tags with higher-order functions.",
      "Return explicit quality flags and an intentional output schema.",
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
      "Expose previous timestamp and days since previous order.",
      "Calculate cumulative spend, final lifetime spend, and lifetime share.",
      "Preserve the completed-order grain and safely handle zero totals.",
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
    """Return accepted events, item-grain rows, and rejected payloads."""
    # Columns: event_id, payload
    payload_schema = "event_type string, user_id string, amount decimal(12,2), customer struct<id:string>, items array<struct<sku:string,quantity:int>>, attributes map<string,string>"
    # TODO: parse once, attach rejection_reasons, and build all three outputs.
    return events, events, events


valid_events, item_rows, malformed_events = parse_events(events)
result = valid_events`,
    criteria: [
      "Parse JSON with an explicit schema.",
      "Return accepted-event and item-level outputs with documented grains.",
      "Use explode_outer so an empty item array remains observable.",
      "Retain malformed payloads with an array of rejection reasons.",
    ],
  },
  {
    id: "quality_rules",
    sourcePath: "/docs/03-production-engineering/02-data-quality-and-idempotency.md",
    exerciseNumber: 1,
    functionName: "evaluate_quality",
    starter: `def evaluate_quality(orders):
    """Return (valid, rejected, rule_counts) with all failures per row."""
    # Columns: order_id, customer_id, amount_raw, status, event_at
    # TODO: parse amount, evaluate all six named rules, and route by array size.
    return orders, orders, orders


valid_orders, rejected_orders, rule_counts = evaluate_quality(orders)
result = rule_counts`,
    criteria: [
      "Evaluate missing key, malformed amount, negative amount, invalid status, stale data, and duplicate key.",
      "Retain every applicable failure per rejected row.",
      "Make valid and rejected outputs mutually exclusive and exhaustive.",
      "Return aggregate counts by named rule without collecting source rows.",
    ],
  },
];

const byExercise = new Map(
  labs.map((lab) => [`${lab.sourcePath}#${lab.exerciseNumber}`, lab]),
);

export function labFor(sourcePath: string, exerciseNumber: number): LabDefinition | undefined {
  return byExercise.get(`${sourcePath}#${exerciseNumber}`);
}
