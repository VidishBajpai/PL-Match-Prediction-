# Premier League Match Prediction

A quantitative sports analytics and machine learning pipeline predicting Premier League match outcomes (Home Win / Draw / Away Win), expected goals (xG), and exact scorelines using 5 seasons of historical match data (`2021/22` to `2025/26`).

---

## 🚀 Architecture: 3-Stage Modular Notebook Pipeline

The project is structured into three clean, self-contained notebooks with markdown documentation guiding every step:

### [1. Data Preparation & Advanced Feature Engineering](01_Data_Prep_and_Feature_Engineering.ipynb)
- **Dynamic Club Elo Rating System**: Dynamically tracks team strength across time with margin-of-victory scaling and home advantage (+65 Elo). Zero future leakage.
- **Vectorized Rolling Metrics**: Fast calculations using shifted `groupby('Team').rolling(5)`:
  - Form Points (last 5 games)
  - Goal scoring & conceding averages + Goal Difference (GD)
  - Shots on Target (SoT) and Shots on Target Ratio ($\frac{\text{SoT For}}{\text{SoT Total}}$)
  - Home-specific and Away-specific venue strength
- **Fatigue & Rest Days**: Measures fixture congestion and recovery days between games.
- **Differential Features**: Generates relative matchup differences (`Elo_Diff`, `Diff_Form`, `Diff_ST`, `Diff_STRatio`).
- **Output**: Exports `dataset/processed_match_dataset.csv`.

### [2. Model Training & Multi-Model Evaluation](02_Model_Training_and_Evaluation.ipynb)
- **Chronological Split & TimeSeriesSplit**: Evaluates temporal generalization without future data leaking into past folds.
- **Models Implemented**:
  1. *Historical Baseline Prior*
  2. *Regularized Multinomial Logistic Regression* with `StandardScaler`
  3. *Calibrated XGBoost Classifier* with sigmoid probability scaling
  4. *Bivariate Poisson / Dixon-Coles Goal Model* (industry benchmark estimating attack & defense parameters)
  5. *Optimal Ensemble Blend* (60% XGBoost + 40% Poisson)
- **Sports Evaluation Metrics**:
  - Accuracy (%)
  - Multi-class Log Loss (Cross-Entropy)
  - Ranked Probability Score (RPS)
- **Output**: Exports trained models to `saved_models/`.

### [3. Match Predictor & Live API Inference](03_Match_Predictor_and_Live_Inference.ipynb)
- **Pre-Match 'Tale of the Tape'**: Head-to-head comparison of Elo, Form, Goal outputs, and Shots on Target.
- **Expected Goals (xG)**: Forecasts expected goals for both teams ($\lambda_H$ vs $\lambda_A$).
- **Calibrated Win/Draw/Loss Probabilities**: Outputs probability distribution with visual bars.
- **Top 5 Most Likely Scorelines**: Generates exact score probabilities (e.g. 2-1: 12.3%, 1-1: 11.1%).
- **Automated Live Fixture Predictor**: Directly queries `football-data.org` to fetch upcoming matches and predict the entire game-week.

---

## 🛠️ Tech Stack
- **Python 3.13**
- **Pandas & NumPy**: Vectorized time-series manipulations
- **Scikit-Learn**: TimeSeriesSplit, regularized models, probability calibration
- **XGBoost**: Gradient boosted decision trees
- **SciPy**: Poisson probability distributions & parameter fitting
- **Requests**: Football-Data API integration