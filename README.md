# Premier League Match Prediction (Actual xG Upgraded)

A quantitative sports analytics and machine learning pipeline predicting Premier League match outcomes (Home Win / Draw / Away Win), Expected Goals (xG), and exact scorelines using historical match data (`2021/22` to `2025/26`) and live API updates for the `2026/27` season.

---

## 🚀 Architecture: 3-Stage Modular Notebook Pipeline

The project is structured into three clean, self-contained notebooks with markdown documentation guiding every step:

### [1. Data Preparation & Advanced Feature Engineering](notebooks/01_Data_Prep_and_Feature_Engineering.ipynb)
- **Actual Match-Level Expected Goals (xG) Engine**: Calibrated Shot-Quality model mapping shots on target, off-target shots, corners, red cards, and venue to actual chance quality ($xG_H, xG_A$). Eliminates misleading finishing variance and luck from raw scorelines.
- **Dual-Horizon Architecture**:
  - *Long-Term Baseline Quality (15 games)*: Rolling Expected Goal Difference (`Long_xGD_15`), xG Created (`Long_xG_15`), xG Conceded (`Long_xGA_15`), Net Shots on Target (`Long_Net_ST_15`), and Points per Game (`Long_PPG_15`).
  - *Short-Term Momentum (5 games)*: Recent Expected Goal Difference (`Short_xGD_5`) and Form Points (`Short_Form_5`).
- **Dynamic Club Elo Rating System**: $K=28, H_{\text{adv}}=65$ with margin-of-victory scaling. Elite clubs span 1800–1950 while relegation sides sit at 1300–1400.
- **Live 2026/27 Season Ingestion**: Fetches active completed matches from `football-data.org`.
- **Output**: Exports `dataset/processed_match_dataset.csv`.

### [2. Model Training & Multi-Model Evaluation](notebooks/02_Model_Training_and_Evaluation.ipynb)
- **Actual xG Time-Decayed Dixon-Coles Goal Model**: Fits exponential time-decayed attack ($\alpha_i$) and defense ($\beta_i$) ratings on true match xG rates, producing razor-sharp goal rate expectations ($\lambda_H, \lambda_A$).
- **Dual-Horizon Calibrated XGBoost**: Explores non-linear interactions across Expected Goal Difference differentials (`Diff_Quality_xGD`, `Diff_Short_xGD`) and Elo.
- **Strategy A (Continuous Expected Goal Margin Regression $\Delta xG$)**:
  - Trains an `XGBRegressor` on continuous margin $\Delta xG = \text{Home\_xG} - \text{Away\_xG}$.
  - Maps predictions into 3-class probabilities via 1D monotonic calibration.
  - Decision threshold optimization ($[T_1^*, T_2^*]$) for maximum accuracy and draw capture.
- **Master xG Tri-Hybrid Ensemble**:
  $$P_{\text{Master}} = 0.40 \times P_{\text{xG-DixonColes}} + 0.30 \times P_{\text{xG-XGBoost}} + 0.30 \times P_{\text{xG-Margin}}$$
- **Output**: Exports trained models, calibrators, and thresholds to `saved_models/`.

### [3. Match Predictor & Live API Inference](notebooks/03_Match_Predictor_and_Live_Inference.ipynb)
- **Tale of the Tape**: Comprehensive head-to-head comparison including Club Elo, Baseline xG Created, Baseline xG Conceded, Expected Goal Difference (xGD), and Net Shots on Target.
- **Expected Goals (xG) Forecast**: Real expected goal outputs for both clubs ($\lambda_H$ vs $\lambda_A$).
- **Outcome Probabilities**: Master Tri-Hybrid Ensemble distribution with visual confidence bars.
- **Strategy A Decision Call**: Categorical verdict based on optimal margin thresholds.
- **Top 5 Most Likely Exact Scorelines**: Exact score probabilities from Poisson bivariate distribution.
- **Interactive Match Predictor**: Type in any two clubs for instant live prediction with fuzzy matching.
- **Automated 2026/27 Fixtures API Predictor**: Queries `football-data.org` to forecast upcoming game-weeks.

---

## 🤖 Automated Weekly Pipeline & GitHub Actions CI/CD

The system features an automated unattended production pipeline that runs on schedule:
- **Weekly Schedule**:
  - **Tuesdays @ 06:00 UTC**: Runs immediately after Monday Night Football to ingest new match scores, recalculate dynamic Elo ratings, and update rolling Actual xG form.
  - **Fridays @ 06:00 UTC**: Runs ahead of the weekend kickoff to refresh models and publish an updated game-week prediction bulletin.
  - **Manual Trigger (`workflow_dispatch`)**: Can be triggered manually anytime via GitHub Actions UI with one click.
- **Pipeline Runner**: [`scripts/weekly_pipeline.py`](scripts/weekly_pipeline.py)
- **GitHub Workflow**: [`.github/workflows/weekly_predict.yml`](.github/workflows/weekly_predict.yml)
- **Live Output**: Automatically commits fresh models, updates the dataset, and writes the game-week briefing to [`reports/latest_gameweek_predictions.md`](reports/latest_gameweek_predictions.md) (also published as a GitHub Action Job Summary).

---

## 🌐 Web Application (FastAPI + React TypeScript + Tailwind)

An interactive, responsive sports analytics platform for live match forecasting and head-to-head simulations:
- **Interactive Match Arena**: Select any two clubs, customize rest days to simulate fatigue, and view Master Tri-Hybrid win probabilities, expected goals ($\lambda_H$ vs $\lambda_A$), Strategy A margin verdicts, and top scorelines.
- **Tale of the Tape**: Side-by-side metric comparison (Elo ratings, baseline xG, xGA, net xGD, recent form, shots on target).
- **Game-Week Hub**: All upcoming matchday fixtures (e.g. Game-Week 6) with model consensus and probabilities.
- **Elo Power Rankings**: Full Premier League table ranked by model Elo ratings and rolling xGD.

### 🚀 Running the Web App

#### Option A: Unified Single-Server (Production)
Run one command from the project root:
```bash
uvicorn api.main:app --port 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

#### Option B: Development Mode (Hot-Reloading)
- **Backend**:
  ```bash
  uvicorn api.main:app --reload --port 8000
  ```
- **Frontend**:
  ```bash
  cd frontend && npm run dev
  ```
  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack
- **Python 3.12 / 3.13** (FastAPI, Scikit-Learn, XGBoost, SciPy, Pandas, NumPy)
- **TypeScript & React** (Vite, Tailwind CSS v4, Lucide Icons)
- **GitHub Actions**: Scheduled weekly cron orchestration & automated model synchronization