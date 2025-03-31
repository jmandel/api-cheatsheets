## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense, self-contained overview of the Scikit-learn library based on its documentation. It covers core concepts, essential API elements, common workflows, and key functionalities for supervised and unsupervised learning, model evaluation, preprocessing, and more. It is designed to help you quickly understand and start using Scikit-learn for machine learning tasks in Python, assuming a basic familiarity with ML concepts but not specifically with this library. All information is derived solely from the provided documentation snippets.

---

## Scikit-learn Cheatsheet

### Core Concepts

*   **Estimator**: The base object in Scikit-learn. Implements a `fit` method to learn from data.
    *   `estimator.fit(X, y=None)`: Fits the model to training data `X` and targets `y` (if supervised). Returns `self`. Should validate parameters and data, clear previous attributes (unless `warm_start=True`), and store estimated model attributes (ending with `_`).
    *   Parameters passed during construction (`__init__`) define the estimator's configuration and are stored as attributes without modification.
    *   Estimated attributes (learned from data during `fit`) end with an underscore (e.g., `coef_`).
    *   Stateless estimators do not store information during `fit`.
*   **Predictor**: An estimator supporting `predict` and/or `fit_predict`. Includes classifiers, regressors, outlier detectors, clusterers.
    *   `predictor.predict(X)`: Makes predictions for new data `X`. Output format depends on the estimator type (class labels, continuous values, cluster IDs).
*   **Transformer**: An estimator supporting `transform` and/or `fit_transform`. Modifies data (e.g., scaling, encoding, feature extraction).
    *   `transformer.transform(X)`: Transforms data `X`. Output usually has the same number of samples as input.
    *   `transformer.fit_transform(X, y=None)`: Fits to data, then transforms it. May be more efficient than `fit` then `transform`. **Warning:** Applying `fit_transform` to the entire dataset before cross-validation can lead to data leakage.
*   **Model**: An estimator that can evaluate goodness of fit or likelihood.
    *   `model.score(X, y=None)`: Returns a score indicating performance (higher is better). Default depends on estimator type (accuracy for classification, R² for regression).
*   **Meta-estimator**: An estimator that takes another estimator as a parameter (e.g., `Pipeline`, `GridSearchCV`). Usually clones the wrapped estimator during its `fit` method.
*   **Cloning**: Use `sklearn.base.clone(estimator)` to create a new, unfitted estimator instance with identical parameters.
*   **Data Format (`array-like`)**: Input data (`X`, `y`) is typically expected as NumPy arrays, lists of numbers, or compatible types like pandas DataFrames (with numeric columns). Sparse matrices (`scipy.sparse`) are supported by many estimators. Output is generally NumPy arrays or sparse matrices.
*   **Parameters vs Attributes**: Parameters are passed to `__init__` and stored unchanged. Attributes ending in `_` are estimated during `fit`.
*   **`get_params()` / `set_params()`**: Methods (usually inherited from `BaseEstimator`) to inspect and modify estimator parameters, crucial for model selection tools. Uses `__` notation for nested parameters (e.g., `pipeline__stepname__param`).
*   **`random_state`**: Parameter to control randomness in estimators and splitters.
    *   `None` (default): Uses the global `numpy.random` state, results may vary across calls.
    *   `int`: Uses the integer as a seed for a new `RandomState` instance. Ensures reproducibility across calls.
    *   `RandomState` instance: Uses the provided instance. Subsequent calls will produce different results as the state is consumed. **Recommended for robust CV results in estimators.** Integers are often safer for CV splitters.
*   **`n_jobs`**: Parameter to specify the number of CPU cores to use for parallelization, often via `joblib`.
    *   `1`: Use one core (no parallelism).
    *   `-1`: Use all available cores.
    *   `-2`: Use all cores but one, etc.
    *   Default (`None`) usually means 1 unless in a `joblib.parallel_backend` context.
*   **Parallelism Backends**: `joblib` (used by `n_jobs`) supports `loky` (default, multi-processing, better isolation, memory mapping for large arrays) and `threading` (multi-threading, lower overhead, requires GIL release in compiled code). Control with `joblib.parallel_backend` context manager.
*   **Lower-level Parallelism**: OpenMP (in Cython/C code, controlled by `OMP_NUM_THREADS`) and BLAS (in NumPy/SciPy, controlled by `MKL_NUM_THREADS`, `OPENBLAS_NUM_THREADS`, etc.) provide thread-based parallelism independent of `n_jobs`. `threadpoolctl` can also be used.
*   **Oversubscription**: Avoid using significantly more threads/processes than CPU cores. `joblib` with the `loky` backend attempts to mitigate this automatically for nested calls.
*   **Configuration**: Use `sklearn.set_config()` or `sklearn.config_context()` to control global settings like `assume_finite` (skip NaN/inf checks for speed) and `working_memory` (limit for chunked operations). Environment variables like `SKLEARN_ASSUME_FINITE` can also be used.
*   **Estimator Tags**: Annotations describing estimator capabilities (e.g., sparse matrix support, multioutput support). Accessed via `estimator._get_tags()`. Used internally for `check_estimator` and determining behavior. See `sklearn.utils.Tags`.
*   **HTML Representation**: Estimators display an interactive HTML diagram in environments like Jupyter. Controlled by `sklearn.set_config(display=...)`. Customize via `_doc_link_*` attributes or `estimator_html_repr`.

### Common Workflow

1.  **Load Data**: Use utilities from `sklearn.datasets` or load external data (e.g., using pandas).
2.  **Preprocess Data**:
    *   Handle missing values (`sklearn.impute`).
    *   Encode categorical features (`sklearn.preprocessing.OneHotEncoder`, `OrdinalEncoder`, `TargetEncoder`).
    *   Scale numerical features (`sklearn.preprocessing.StandardScaler`, `MinMaxScaler`, `RobustScaler`).
    *   Normalize samples (`sklearn.preprocessing.Normalizer`).
    *   Extract features (e.g., text: `sklearn.feature_extraction.text.CountVectorizer`, `TfidfVectorizer`; images: `sklearn.feature_extraction.image.PatchExtractor`).
    *   Generate non-linear features (`sklearn.preprocessing.PolynomialFeatures`, `SplineTransformer`).
3.  **Split Data**: Use `sklearn.model_selection.train_test_split` to create training and testing sets.
4.  **Build Pipeline** (Recommended): Chain preprocessing steps and the final estimator using `sklearn.pipeline.Pipeline` or `sklearn.pipeline.make_pipeline`. Use `sklearn.compose.ColumnTransformer` for applying different steps to different columns.
5.  **Train Model**: Call the `fit(X_train, y_train)` method of the estimator or pipeline.
6.  **Make Predictions**: Call `predict(X_test)` or `predict_proba(X_test)` (for classifiers) or `transform(X_test)` (for transformers).
7.  **Evaluate Model**:
    *   Use `estimator.score(X_test, y_test)`.
    *   Use functions from `sklearn.metrics` (e.g., `accuracy_score`, `mean_squared_error`, `roc_auc_score`).
    *   Use cross-validation (`sklearn.model_selection.cross_val_score`, `cross_validate`) for more robust evaluation.
8.  **Tune Hyperparameters**: Use `sklearn.model_selection.GridSearchCV`, `RandomizedSearchCV`, or Successive Halving variants (`HalvingGridSearchCV`, `HalvingRandomSearchCV`).
9.  **Persist Model**: Save the trained model using methods described in :ref:`model-persistence`.

### Pipelines and Composite Estimators

*   **`Pipeline`**: Chains multiple estimators sequentially. All steps except the last must be transformers. Implements methods of the last step.
    *   `make_pipeline(*steps)`: Convenience function to create a Pipeline without naming steps.
    *   Access steps via `.steps` attribute, slicing, or indexing (e.g., `pipe[0]`, `pipe['step_name']`).
    *   Access named steps via `.named_steps` attribute (e.g., `pipe.named_steps.step_name`).
    *   Access/Set nested parameters using `__` syntax (e.g., `pipe.set_params(step_name__parameter=value)`).
    *   **Caching**: Set `memory` parameter (path or `joblib.Memory` instance) to cache transformers, avoiding re-computation during e.g., grid search. **Warning**: Caching clones transformers; inspect fitted transformers via `named_steps`.
*   **`FeatureUnion`**: Combines multiple transformer objects in parallel. Concatenates their outputs side-by-side.
    *   `make_union(*transformers)`: Convenience function.
    *   Steps can be set to `'drop'` to ignore them.
*   **`ColumnTransformer`**: Applies different transformers to different columns of an array or DataFrame. Very useful for heterogeneous data.
    *   Specify transformers as list of tuples: `(name, transformer, columns)`.
    *   `columns` can be names (for DataFrames), indices, slices, boolean masks, or selectors from `make_column_selector`.
    *   `remainder` parameter controls handling of columns not specified: `'drop'` (default), `'passthrough'`, or another transformer.
    *   `make_column_transformer(...)`: Convenience function.
*   **`TransformedTargetRegressor`**: Transforms the target `y` before fitting a regression model. Predictions are inverse-transformed back. Accepts a transformer or `func`/`inverse_func` pair.

### Model Evaluation (`sklearn.metrics`)

*   **Scoring Parameter (`scoring`)**: Used in `GridSearchCV`, `cross_validate`, etc.
    *   `None`: Uses estimator's default `score` method.
    *   String name (e.g., `'accuracy'`, `'neg_mean_squared_error'`, `'roc_auc'`). Higher values must be better. Use `sklearn.metrics.get_scorer_names()` for list.
    *   Callable: Custom scorer function or object created with `make_scorer`.
*   **`make_scorer(score_func, *, greater_is_better=True, needs_proba=False, needs_threshold=False, **kwargs)`**: Creates a scorer from a metric function.
    *   Set `greater_is_better=False` for loss functions.
    *   Set `needs_proba=True` if the metric needs probability estimates (`predict_proba`).
    *   Set `needs_threshold=True` if the metric needs non-thresholded scores (`decision_function`).
*   **Multiple Metric Evaluation**: Pass a list of strings or a dict (`{'name': scorer}`) to `scoring`. Set `refit` to the name of the metric to use for finding the best estimator in grid search.
*   **Classification Metrics**:
    *   `accuracy_score`: Fraction or count of correct predictions. Subset accuracy for multilabel.
    *   `top_k_accuracy_score`: Correct if true label is among top `k` predictions.
    *   `balanced_accuracy_score`: Average recall per class. Robust to imbalanced datasets.
    *   `cohen_kappa_score`: Agreement between two raters (not classifier vs ground truth).
    *   `confusion_matrix`: `C[i, j]` = count of true class `i` predicted as class `j`. Use `ConfusionMatrixDisplay` to plot.
    *   `classification_report`: Text report with precision, recall, F1-score per class.
    *   `hamming_loss`: Fraction of incorrectly predicted labels (works for multilabel).
    *   `precision_score`, `recall_score`, `f1_score`, `fbeta_score`: Metrics based on TP, FP, FN. Support various averaging methods (`'micro'`, `'macro'`, `'weighted'`, `'samples'`).
    *   `precision_recall_curve`: Computes precision-recall pairs for different thresholds. Use `PrecisionRecallDisplay` to plot.
    *   `average_precision_score`: Area under the precision-recall curve (AP).
    *   `roc_curve`: Computes Receiver Operating Characteristic curve (TPR vs FPR). Use `RocCurveDisplay` to plot.
    *   `roc_auc_score`: Area Under the ROC Curve (AUC). Supports multiclass (`'ovo'`, `'ovr'`) and multilabel averaging.
    *   `det_curve`: Detection Error Tradeoff curve (FNR vs FPR). Use `DetCurveDisplay` to plot.
    *   `log_loss`: Cross-entropy loss, based on probability estimates.
    *   `hinge_loss`: Loss function used by linear SVMs.
    *   `brier_score_loss`: Mean squared error for probability predictions.
    *   `matthews_corrcoef`: Balanced measure for binary and multiclass, accounts for class imbalance.
    *   `jaccard_score`: Jaccard similarity coefficient.
    *   `multilabel_confusion_matrix`: Computes confusion matrix per label for multilabel data.
*   **Regression Metrics**:
    *   `explained_variance_score`: Proportion of variance explained. Best is 1.0.
    *   `max_error`: Maximum residual error.
    *   `mean_absolute_error` (MAE): Average absolute difference.
    *   `mean_squared_error` (MSE): Average squared difference.
    *   `root_mean_squared_error` (RMSE): Square root of MSE.
    *   `mean_squared_log_error` (MSLE): MSE of log-transformed values. Use for exponential growth targets. Penalizes under-prediction more.
    *   `root_mean_squared_log_error` (RMSLE): Square root of MSLE.
    *   `median_absolute_error` (MedAE): Median of absolute differences. Robust to outliers.
    *   `r2_score`: Coefficient of determination (:math:`R^2`). Proportion of variance explained. Best is 1.0, can be negative.
    *   `mean_absolute_percentage_error` (MAPE): Average relative error. Sensitive to relative errors, not global scaling.
    *   `mean_pinball_loss`: Loss function for quantile regression.
    *   `mean_tweedie_deviance`: Generalization of MSE (power=0), Poisson deviance (power=1), Gamma deviance (power=2). Use `mean_poisson_deviance` or `mean_gamma_deviance` directly.
    *   `d2_score`: Coefficient of determination generalized to arbitrary regression loss functions (`d2_tweedie_score`, `d2_pinball_score`, `d2_absolute_error_score`).
*   **Clustering Metrics**: (See :ref:`clustering_evaluation` section in documentation for details - requires ground truth or uses internal measures)
    *   With ground truth: `rand_score`, `adjusted_rand_score`, `mutual_info_score`, `adjusted_mutual_info_score`, `normalized_mutual_info_score`, `homogeneity_score`, `completeness_score`, `v_measure_score`, `fowlkes_mallows_score`.
    *   Without ground truth: `silhouette_score`, `calinski_harabasz_score`, `davies_bouldin_score`.
*   **Dummy Estimators** (`DummyClassifier`, `DummyRegressor`): Provide baseline scores using simple rules (e.g., predict most frequent class, mean value). Useful sanity checks.

### Cross-Validation (`sklearn.model_selection`)

*   **Purpose**: Estimate generalization performance by splitting data into multiple train/test folds. Avoids overfitting on a single validation set.
*   **Functions**:
    *   `cross_val_score(estimator, X, y, *, scoring=None, cv=None)`: Evaluate a score by cross-validation. Returns array of scores for each fold.
    *   `cross_validate(estimator, X, y, *, scoring=None, cv=None, return_train_score=False, return_estimator=False, return_indices=False)`: More detailed evaluation. Returns a dict with test scores, fit times, score times, and optionally train scores and fitted estimators per fold. Allows multiple metrics.
    *   `cross_val_predict(estimator, X, y, *, cv=None, method='predict')`: Returns predictions for each sample when it was in the test set. Useful for visualization or model blending, **not** for generalization error estimation.
*   **Splitters (pass to `cv` parameter)**:
    *   **For i.i.d. data**:
        *   `KFold(n_splits=5, *, shuffle=False, random_state=None)`: Splits data into `k` consecutive folds.
        *   `RepeatedKFold(n_splits=5, *, n_repeats=10, random_state=None)`: Repeats K-Fold `n` times.
        *   `LeaveOneOut()`: Each sample is used once as a test set (`k=n`). Computationally expensive.
        *   `LeavePOut(p)`: Leaves `p` samples out in each test set. Very expensive.
        *   `ShuffleSplit(n_splits=10, *, test_size=None, train_size=None, random_state=None)`: Generates independent train/test splits by shuffling and splitting. Allows control over test/train size.
    *   **Stratified (preserve class proportions)**:
        *   `StratifiedKFold(n_splits=5, *, shuffle=False, random_state=None)`: K-Fold with stratification. Default for classifiers when `cv` is an integer.
        *   `RepeatedStratifiedKFold(n_splits=5, *, n_repeats=10, random_state=None)`: Repeats Stratified K-Fold `n` times.
        *   `StratifiedShuffleSplit(...)`: ShuffleSplit with stratification.
    *   **For grouped data (ensure samples from the same group are not in both train and test)**:
        *   `GroupKFold(n_splits=5)`: K-Fold variant for grouped data.
        *   `StratifiedGroupKFold(n_splits=5, *, shuffle=False, random_state=None)`: Combines stratification and group separation.
        *   `LeaveOneGroupOut()`: Leaves out one group per split.
        *   `LeavePGroupsOut(n_groups)`: Leaves out `P` groups per split.
        *   `GroupShuffleSplit(n_splits=5, *, test_size=None, train_size=None, random_state=None)`: Randomized group-aware splits.
    *   **For time series data**:
        *   `TimeSeriesSplit(n_splits=5, *, max_train_size=None, test_size=None, gap=0)`: Creates folds where test set samples are always later than train set samples. Training sets are growing prefixes.
    *   **Predefined splits**:
        *   `PredefinedSplit(test_fold)`: Uses a predefined partitioning specified by an array `test_fold`.

### Parameter Tuning (`sklearn.model_selection`)

*   **`GridSearchCV(estimator, param_grid, *, scoring=None, cv=None, refit=True, ...)`**: Exhaustively searches over specified parameter values (`param_grid`).
    *   `param_grid`: Dictionary or list of dictionaries mapping parameter names (using `__` for nested) to lists of values to try.
*   **`RandomizedSearchCV(estimator, param_distributions, *, n_iter=10, scoring=None, cv=None, refit=True, random_state=None, ...)`**: Samples a fixed number (`n_iter`) of parameter settings from specified distributions.
    *   `param_distributions`: Dictionary mapping parameter names to distributions (from `scipy.stats`, e.g., `uniform`, `randint`, `loguniform`) or lists of discrete values.
*   **Successive Halving (Experimental)**: Iteratively selects best candidates using increasing resources. Faster than exhaustive search. Enable with `from sklearn.experimental import enable_halving_search_cv`.
    *   `HalvingGridSearchCV(...)`: Successive halving with a grid.
    *   `HalvingRandomSearchCV(...)`: Successive halving with random sampling.
    *   Key parameters: `factor` (resource increase/candidate decrease rate), `resource` (parameter to budget on, e.g., `'n_samples'`), `min_resources`.
*   **`cv_results_`**: Attribute available after fitting search objects. A dictionary (convertible to pandas DataFrame) containing detailed results for each parameter combination and fold (scores, times, ranks, parameters).
*   **`best_estimator_`**: Attribute with the estimator refitted on the whole development set using the best found parameters.
*   **`best_params_`**: Dictionary with the best parameter settings found.
*   **`best_score_`**: Score achieved by `best_estimator_` on the development set (using the `refit` metric if multiple metrics were used).

### Common Pitfalls & Best Practices

*   **Data Leakage**: Avoid using information from the test set during training.
    *   **Preprocessing**: Fit preprocessors (scalers, imputers, encoders) *only* on the training data, then `transform` both train and test sets.
    *   **Pipelines**: Use `Pipeline` to encapsulate preprocessing and model fitting. This ensures correct application within cross-validation and prevents leakage.
*   **Inconsistent Preprocessing**: Apply the *exact same* preprocessing steps (fitted on train data) to both training and test/new data. Pipelines help enforce this.
*   **Controlling Randomness (`random_state`)**:
    *   Use an `int` seed for reproducibility across multiple runs *of the same script*.
    *   Use `RandomState` instances (or `None`) within cross-validation loops evaluating *estimators* to assess robustness to initialization/random aspects of the algorithm itself.
    *   Use `int` seeds for *CV splitters* if you need the *same splits* across different estimator comparisons or multiple calls to `cross_val_score`/`GridSearchCV`.
*   **Feature Scaling**: Many algorithms (SVMs, linear models with regularization, PCA, k-Means) perform better or converge faster when features are scaled (e.g., using `StandardScaler`). Tree-based models are generally insensitive to feature scaling.
*   **Categorical Features**: Most estimators require numerical input. Encode categorical features using `OneHotEncoder` (recommended for linear models, k-Means) or `OrdinalEncoder` (suitable for tree-based models). `TargetEncoder` is useful for high-cardinality features. `HistGradientBoosting*` estimators have native support.
*   **Missing Values**: Most estimators require data without missing values (`NaN`). Use imputation strategies (`SimpleImputer`, `IterativeImputer`, `KNNImputer`) or models with native support (`HistGradientBoosting*`). `MissingIndicator` can create binary features indicating missingness.
*   **Model Persistence**: Choose method based on security needs and environment consistency (see :ref:`model-persistence` section).

### Model Persistence (`sklearn.model_persistence` concepts)

*   **Goal**: Save a trained model for future use without retraining.
*   **Methods**:
    *   **`pickle` / `joblib` / `cloudpickle`**:
        *   Pros: Native Python, versatile, efficient (`joblib` for large arrays, `cloudpickle` for complex objects like lambdas). `protocol=5` recommended for efficiency.
        *   Cons: **Security risk** (loading can execute arbitrary code), requires **identical** Python and library versions (especially scikit-learn, numpy, scipy) between saving and loading environments. Not guaranteed across versions.
    *   **`skops.io`**:
        *   Pros: More secure than pickle (validates types/functions), allows partial inspection before loading.
        *   Cons: Less performant than pickle, supports fewer types, still requires same environment versions.
    *   **ONNX (`sklearn-onnx`)**:
        *   Pros: Framework-agnostic format, can serve models without Python, potentially more secure (run in sandboxed runtime), environment independence.
        *   Cons: Not all models/parameters supported, custom estimators need extra work, original Python object is lost.
*   **Best Practice**: Along with the model file, save metadata: training script, library versions, training data reference/hash, cross-validation score.
*   **Versioning**: Loading models across different scikit-learn versions is **unsupported and unsafe**. A `InconsistentVersionWarning` is raised on mismatch. Retrain the model with the new version if needed.

### Key Modules & Estimators (Based on `api_reference.py`)

*(A non-exhaustive list highlighting major areas)*

*   **`sklearn.base`**: Base classes (`BaseEstimator`, Mixins like `ClassifierMixin`, `RegressorMixin`, `TransformerMixin`).
*   **`sklearn.calibration`**: Probability calibration (`CalibratedClassifierCV`, `calibration_curve`).
*   **`sklearn.cluster`**: Clustering algorithms (`KMeans`, `MiniBatchKMeans`, `DBSCAN`, `HDBSCAN`, `OPTICS`, `AgglomerativeClustering`, `SpectralClustering`, `AffinityPropagation`, `Birch`, `MeanShift`).
*   **`sklearn.compose`**: Tools for composite estimators (`ColumnTransformer`, `TransformedTargetRegressor`).
*   **`sklearn.covariance`**: Covariance estimation (`EmpiricalCovariance`, `GraphicalLasso`, `LedoitWolf`, `MinCovDet`, `OAS`).
*   **`sklearn.cross_decomposition`**: PLS methods (`PLSRegression`, `PLSCanonical`, `CCA`).
*   **`sklearn.datasets`**: Dataset loading (`load_*`), fetching (`fetch_*`), and generation (`make_*`).
*   **`sklearn.decomposition`**: Matrix factorization (`PCA`, `IncrementalPCA`, `KernelPCA`, `NMF`, `FastICA`, `TruncatedSVD`, `DictionaryLearning`, `FactorAnalysis`).
*   **`sklearn.discriminant_analysis`**: LDA and QDA (`LinearDiscriminantAnalysis`, `QuadraticDiscriminantAnalysis`).
*   **`sklearn.dummy`**: Baseline estimators (`DummyClassifier`, `DummyRegressor`).
*   **`sklearn.ensemble`**: Ensemble methods (Bagging: `BaggingClassifier`; Forests: `RandomForestClassifier`, `ExtraTreesClassifier`; Boosting: `AdaBoostClassifier`, `GradientBoostingClassifier`, `HistGradientBoostingClassifier`; Voting: `VotingClassifier`; Stacking: `StackingClassifier`). Regressor versions also available.
*   **`sklearn.exceptions`**: Custom warnings and errors (`NotFittedError`, `ConvergenceWarning`).
*   **`sklearn.feature_extraction`**: Feature extraction from text (`CountVectorizer`, `TfidfVectorizer`, `HashingVectorizer`) and images (`PatchExtractor`). Also `DictVectorizer`, `FeatureHasher`.
*   **`sklearn.feature_selection`**: Feature selection methods (`VarianceThreshold`, `SelectKBest`, `SelectFromModel`, `RFE`, `RFECV`, `SequentialFeatureSelector`).
*   **`sklearn.gaussian_process`**: Gaussian Processes (`GaussianProcessClassifier`, `GaussianProcessRegressor`, various kernels).
*   **`sklearn.impute`**: Handling missing values (`SimpleImputer`, `IterativeImputer` (experimental), `KNNImputer`, `MissingIndicator`).
*   **`sklearn.inspection`**: Model inspection (`partial_dependence`, `permutation_importance`, `DecisionBoundaryDisplay`, `PartialDependenceDisplay`).
*   **`sklearn.isotonic`**: Isotonic regression (`IsotonicRegression`).
*   **`sklearn.kernel_approximation`**: Approximate kernel feature maps (`Nystroem`, `RBFSampler`).
*   **`sklearn.kernel_ridge`**: Kernel Ridge Regression (`KernelRidge`).
*   **`sklearn.linear_model`**: Linear models (`LinearRegression`, `Ridge`, `Lasso`, `ElasticNet`, `LogisticRegression`, `SGDClassifier`, `SGDRegressor`, `Perceptron`, `PassiveAggressiveClassifier`, `HuberRegressor`, `QuantileRegressor`, `PoissonRegressor`, `GammaRegressor`, `TweedieRegressor`, etc.). Many have CV variants.
*   **`sklearn.manifold`**: Manifold learning (`TSNE`, `Isomap`, `LocallyLinearEmbedding`, `SpectralEmbedding`, `MDS`).
*   **`sklearn.metrics`**: Model evaluation metrics and scoring tools (See :ref:`model-evaluation` section). Includes `pairwise_distances`, `pairwise_kernels`.
*   **`sklearn.mixture`**: Gaussian Mixture Models (`GaussianMixture`, `BayesianGaussianMixture`).
*   **`sklearn.model_selection`**: Splitting tools (`train_test_split`, splitters like `KFold`), hyperparameter tuning (`GridSearchCV`, `RandomizedSearchCV`), validation tools (`cross_val_score`, `cross_validate`, `learning_curve`, `validation_curve`).
*   **`sklearn.multiclass`**: Multiclass strategies (`OneVsRestClassifier`, `OneVsOneClassifier`, `OutputCodeClassifier`).
*   **`sklearn.multioutput`**: Multioutput strategies (`MultiOutputClassifier`, `MultiOutputRegressor`, `ClassifierChain`, `RegressorChain`).
*   **`sklearn.naive_bayes`**: Naive Bayes classifiers (`GaussianNB`, `MultinomialNB`, `BernoulliNB`, `CategoricalNB`, `ComplementNB`).
*   **`sklearn.neighbors`**: Nearest Neighbors algorithms (`KNeighborsClassifier`, `KNeighborsRegressor`, `NearestNeighbors`, `KernelDensity`, `LocalOutlierFactor`, `NearestCentroid`).
*   **`sklearn.neural_network`**: Neural networks (`MLPClassifier`, `MLPRegressor`, `BernoulliRBM`). **Note**: Basic MLP, not intended for large-scale deep learning (no GPU support).
*   **`sklearn.pipeline`**: Pipeline tools (`Pipeline`, `FeatureUnion`, `make_pipeline`, `make_union`).
*   **`sklearn.preprocessing`**: Data preprocessing (`StandardScaler`, `MinMaxScaler`, `Normalizer`, `OneHotEncoder`, `OrdinalEncoder`, `LabelEncoder`, `PolynomialFeatures`, `PowerTransformer`, `QuantileTransformer`, `KBinsDiscretizer`, `FunctionTransformer`).
*   **`sklearn.random_projection`**: Random projection transformers (`GaussianRandomProjection`, `SparseRandomProjection`).
*   **`sklearn.semi_supervised`**: Semi-supervised learning (`LabelPropagation`, `LabelSpreading`, `SelfTrainingClassifier`).
*   **`sklearn.svm`**: Support Vector Machines (`SVC`, `NuSVC`, `LinearSVC`, `SVR`, `NuSVR`, `LinearSVR`, `OneClassSVM`).
*   **`sklearn.tree`**: Decision Trees (`DecisionTreeClassifier`, `DecisionTreeRegressor`, `ExtraTreeClassifier`, `ExtraTreeRegressor`). Includes plotting (`plot_tree`) and export (`export_text`, `export_graphviz`).
*   **`sklearn.utils`**: Utility functions (validation checks like `check_array`, `check_X_y`, `check_is_fitted`; resampling; math helpers). Includes `check_estimator` for testing custom estimators.

### Experimental Features

*   Enable via `from sklearn.experimental import enable_<feature_name>`. API may change without notice.
*   Key examples mentioned:
    *   `enable_halving_search_cv`: Enables `HalvingGridSearchCV` and `HalvingRandomSearchCV`.
    *   `enable_iterative_imputer`: Enables `IterativeImputer`.
    *   Metadata Routing (`enable_metadata_routing` config flag): System for passing metadata (e.g., `sample_weight`, `groups`) through meta-estimators. Uses `set_*_request` methods. See `metadata_routing.rst` for details and supported estimators.


### Plotting API (`sklearn.metrics`, `sklearn.inspection`, `sklearn.calibration`, `sklearn.model_selection`)

*   Uses `Display` classes (e.g., `RocCurveDisplay`, `ConfusionMatrixDisplay`, `PartialDependenceDisplay`, `PredictionErrorDisplay`, `LearningCurveDisplay`, `ValidationCurveDisplay`).
*   Instantiate via class methods:
    *   `Display.from_estimator(estimator, X, y, ...)`: Computes values and plots.
    *   `Display.from_predictions(y_true, y_pred, ...)`: Computes values from pre-computed predictions and plots.
*   The returned display object stores computed values (e.g., `roc_auc`, `fpr`, `tpr`) and matplotlib objects (`ax_`, `figure_`, `line_`).
*   Use the `.plot(ax=ax, ...)` method of an existing display object to plot it on a specific matplotlib axes `ax`, allowing comparison of multiple models/results.


### Text Feature Extraction (`sklearn.feature_extraction.text`)

*   **Bag of Words**: Represents text documents as numerical vectors based on token counts.
    *   `CountVectorizer`: Tokenizes text and counts token occurrences.
        *   `ngram_range=(min_n, max_n)`: Use n-grams instead of single words.
        *   `stop_words`: List of words to ignore.
        *   `min_df`, `max_df`: Ignore terms with frequency lower/higher than threshold.
        *   `vocabulary_`: Mapping from term to feature index.
        *   `get_feature_names_out()`: Returns feature names.
    *   `TfidfTransformer`: Transforms count matrix to TF-IDF representation.
        *   TF: Term Frequency (how often a term appears in a document).
        *   IDF: Inverse Document Frequency (down-weights terms appearing in many documents).
        *   Formula (default, `smooth_idf=True`): :math:`\text{idf}(t) = \log{\frac{1 + n}{1+\text{df}(t)}} + 1`
    *   `TfidfVectorizer`: Combines `CountVectorizer` and `TfidfTransformer`.
*   **Hashing Trick**: Alternative to count vectorization for large datasets. Uses hashing to map tokens to feature indices directly.
    *   `HashingVectorizer`: Combines tokenization and hashing. Stateless (no `fit` needed). Faster, lower memory, but irreversible (cannot get original feature names).
    *   `FeatureHasher`: More general hashing for features represented as dicts or `(feature, value)` pairs.
*   **Customization**: Provide callables for `preprocessor`, `tokenizer`, or `analyzer` parameters.
*   **Decoding**: Handles text file decoding via `encoding` parameter (default 'utf-8'). `decode_error` handles errors ('ignore', 'replace').

### Miscellaneous

*   **Scikit-learn-contrib**: Hosts external projects compatible with Scikit-learn API.
*   **Citing**: If used in scientific publication, cite the JMLR paper (Pedregosa et al., 2011) and potentially the API design paper (Buitinck et al., 2013). See `about.rst` for BibTeX entries.