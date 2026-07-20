# Exercises: MLlib Pipelines

Source: [Machine learning with MLlib Pipelines](../../05-advanced-apis/03-mllib-pipelines.md)

Estimated time: 120–180 minutes. Difficulty: advanced.

## Key terms reinforced

| Term | Definition |
|---|---|
| Estimator | A stage that learns parameters through `fit`. |
| Transformer | A fitted or fixed stage that changes DataFrames through `transform`. |
| Pipeline | Ordered sequence of estimators and transformers. |
| Leakage | Training with information unavailable at prediction time. |
| Temporal split | Train/evaluation separation based on time. |

## Exercise 1: Leakage audit

Given a monthly churn target, classify candidate features by whether they are available at the prediction cutoff. Include future cancellations, latest support outcome, current lifetime spend, post-cutoff email activity, and account age.

### Deliverable

A feature table with source timestamp, cutoff rule, leakage risk, and correction.

## Exercise 2: Build a Pipeline

Create a small classification pipeline with string indexing, encoding, numeric imputation, vector assembly, and logistic regression. Fit only on training data and transform validation data containing nulls and an unseen category.

## Exercise 3: Evaluate for operations

Calculate area under PR and threshold-level precision/recall. Given a review capacity of 100 accounts per day and different intervention costs, select a threshold and explain the trade-off. Compare with a simple baseline.

## Exercise 4: Reproducibility contract

Define metadata required to reproduce training and scoring: data range/version, feature schema, code artifact, parameters, fitted pipeline path, metrics, random seeds, and environment.

## Self-check

- Were preprocessors fitted on training only?
- Does the split reflect future use and entity grouping?
- Are unseen/null categories handled explicitly?
- Do metrics map to an actual decision capacity?

## Stretch task

Design drift monitoring by feature/segment and a rollback rule for a newly deployed model whose alert volume doubles.
