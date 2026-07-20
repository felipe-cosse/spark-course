# Machine Learning with DataFrame-based MLlib Pipelines

## Key terms on this page

| Term | Definition |
|---|---|
| MLlib | Apache Spark's scalable machine-learning library. |
| Estimator | An ML stage with a `fit` method that learns parameters from data and produces a model/transformer. |
| Transformer | An ML stage with a `transform` method that adds or changes columns without learning new parameters. |
| Pipeline | An ordered sequence of estimators and transformers fitted and applied as one workflow. |
| Feature | An input variable used by a model to generate a prediction. |
| Label | The known target outcome used during supervised training/evaluation. |
| Data leakage | Use of information during training that would not be available at the real prediction time. |
| Temporal split | Dividing training and evaluation data by time so evaluation better represents future use. |
| One-hot encoding | Representing a categorical value as a vector of category indicators. |
| Area under PR | Area under the precision-recall curve, useful for evaluating ranking on imbalanced outcomes. |
| Drift | A change over time in input distributions, relationships, or model performance. |

## Scope

MLlib provides distributed feature transformers, algorithms, evaluation, tuning, and pipelines. Use the DataFrame-based `pyspark.ml` API. The older RDD-based `pyspark.mllib` API is in maintenance mode.

Distributed training is valuable when data preparation or supported algorithms need Spark-scale execution. It does not automatically make every model faster or better than a single-node library.

## Prevent leakage before code

Define:

- prediction timestamp and target horizon;
- which features were available at prediction time;
- entity-aware or time-aware train/validation/test split;
- class imbalance and business cost;
- offline and online feature consistency;
- model, data, and code versioning.

Random splits are inappropriate when future information can leak into training or one entity appears in both training and test in a misleading way.

## Pipeline example

```python
from pyspark.ml import Pipeline
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.evaluation import BinaryClassificationEvaluator
from pyspark.ml.feature import Imputer, OneHotEncoder, StringIndexer, VectorAssembler

tier_indexer = StringIndexer(
    inputCol="customer_tier",
    outputCol="customer_tier_index",
    handleInvalid="keep",
)
encoder = OneHotEncoder(
    inputCols=["customer_tier_index"],
    outputCols=["customer_tier_vector"],
)
imputer = Imputer(
    inputCols=["order_amount", "account_age_days"],
    outputCols=["order_amount_filled", "account_age_days_filled"],
)
assembler = VectorAssembler(
    inputCols=["customer_tier_vector", "order_amount_filled", "account_age_days_filled"],
    outputCol="features",
)
classifier = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=30,
)

pipeline = Pipeline(stages=[tier_indexer, encoder, imputer, assembler, classifier])
model = pipeline.fit(training)
predictions = model.transform(validation)

evaluator = BinaryClassificationEvaluator(labelCol="label", metricName="areaUnderPR")
area_under_pr = evaluator.evaluate(predictions)
```

Read the stages in the order a row travels. `StringIndexer` learns category indices from training data and reserves behavior for unseen categories. `OneHotEncoder` converts that index to a vector. `Imputer` learns replacement values for missing numeric features. `VectorAssembler` combines vector and numeric columns into MLlib's required `features` vector. Finally, logistic regression learns coefficients from that vector and the `label` column.

`pipeline.fit(training)` fits every estimator using only training rows and returns one fitted `PipelineModel`; it is the training action boundary. `model.transform(validation)` creates prediction, probability, and related columns for held-out rows. `evaluate` then materializes the validation result to calculate area under the precision-recall curve. Fitting the preprocessors on validation too would leak evaluation information into the model workflow.

Fitting preprocessing inside the pipeline ensures estimators learn from training data rather than the whole dataset. Fit the pipeline on training only.

## Evaluation that matches work

Area under ROC can look strong on rare events while precision is too low for operations. Track precision/recall at actionable thresholds, alert volume, expected cost, calibration, and segment performance. Report a baseline such as “predict no fraud” or a rules system.

## Model operations

- save the fitted pipeline model to immutable, access-controlled storage;
- record feature schema, training range, source versions, parameters, metrics, and code artifact;
- validate schema and feature drift before scoring;
- design batch scoring to be idempotent;
- monitor performance after labels arrive;
- define rollback and model retirement.

## Work task: churn model design

Design a monthly churn pipeline. Include feature cutoff, label definition, temporal split, null/unseen category behavior, baseline, metrics, model registry metadata, scoring output grain, and monitoring.

### Acceptance criteria

- No post-cutoff events leak into features.
- A customer's records are not split in a misleading way.
- Metrics map to a limited intervention capacity.
- Training and scoring transformations share the fitted pipeline.
- Retraining, rollback, and drift triggers are owned.

References: [MLlib guide](https://spark.apache.org/docs/4.2.0/ml-guide.html), [ML Pipelines](https://spark.apache.org/docs/4.2.0/ml-pipeline.html), and [PySpark ML API](https://spark.apache.org/docs/4.2.0/api/python/reference/pyspark.ml.html).

## Exercises

Complete the [MLlib Pipeline exercises](../exercises/05-advanced-apis/03-mllib-pipelines-exercises.md).
