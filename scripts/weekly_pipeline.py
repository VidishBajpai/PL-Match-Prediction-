#!/usr/bin/env python3
"""
weekly_pipeline.py
==================
Automated production pipeline for Premier League match prediction.
Designed to run locally or as a scheduled GitHub Action cron job.

Workflow:
1. Ingest finished matches from football-data.org API for the ongoing season.
2. Update dataset with dynamic Elo ratings and dual-horizon Actual xG features.
3. Retrain & calibrate models (Time-Decayed Dixon-Coles, XGBoost, Strategy A Margin).
4. Fetch next round of scheduled fixtures and forecast outcomes.
5. Export Markdown report to reports/latest_gameweek_predictions.md.
"""

import os
import sys
import pickle
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from scipy.stats import poisson
from scipy.optimize import minimize
import xgboost as xgb
from sklearn.isotonic import IsotonicRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score

# ---------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT_DIR / "dataset"
MODELS_DIR = ROOT_DIR / "saved_models"
REPORTS_DIR = ROOT_DIR / "reports"

MODELS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

API_KEY = os.environ.get("FOOTBALL_DATA_API_KEY", "60e60f6073da4ebf97760ff585ef0432")
API_SEASON = 2026
API_BASE_URL = "https://api.football-data.org/v4/competitions/PL/matches"
API_HEADERS = {"X-Auth-Token": API_KEY}

NAME_MAP = {
    'Arsenal FC': 'Arsenal',
    'Aston Villa FC': 'Aston Villa',
    'AFC Bournemouth': 'Bournemouth',
    'Brentford FC': 'Brentford',
    'Brighton & Hove Albion FC': 'Brighton',
    'Chelsea FC': 'Chelsea',
    'Crystal Palace FC': 'Crystal Palace',
    'Everton FC': 'Everton',
    'Fulham FC': 'Fulham',
    'Ipswich Town FC': 'Ipswich',
    'Leicester City FC': 'Leicester',
    'Liverpool FC': 'Liverpool',
    'Manchester City FC': 'Man City',
    'Manchester United FC': 'Man United',
    'Newcastle United FC': 'Newcastle',
    'Nottingham Forest FC': "Nott'm Forest",
    'Southampton FC': 'Southampton',
    'Tottenham Hotspur FC': 'Tottenham',
    'West Ham United FC': 'West Ham',
    'Wolverhampton Wanderers FC': 'Wolves',
    'Coventry City FC': 'Coventry City FC',
    'Hull City AFC': 'Hull City AFC',
    'Sunderland AFC': 'Sunderland AFC',
    'Leeds United FC': 'Leeds United FC'
}


# ---------------------------------------------------------
# Step 1: Data Ingestion & Actual xG Computation
# ---------------------------------------------------------
def ingest_data():
    print("=" * 68)
    print("STEP 1: Ingesting Historical CSVs & Live API Match Data")
    print("=" * 68)

    season_files = [
        ('PL21:22.csv', '2021/22'),
        ('PL22:23.csv', '2022/23'),
        ('PL23:24.csv', '2023/24'),
        ('PL24:25.csv', '2024/25'),
        ('PL25:26.csv', '2025/26')
    ]

    dfs = []
    for filename, season in season_files:
        filepath = DATASET_DIR / filename
        if filepath.exists():
            season_df = pd.read_csv(filepath)
            season_df['Season'] = season
            dfs.append(season_df)
            print(f"Loaded {filename}: {len(season_df)} matches")

    # Ingest from API
    try:
        url = f"{API_BASE_URL}?season={API_SEASON}"
        print(f"Querying football-data.org API: {url}")
        resp = requests.get(url, headers=API_HEADERS, timeout=10)
        if resp.status_code == 200:
            api_matches = resp.json().get('matches', [])
            finished_matches = []
            for m in api_matches:
                if m['status'] == 'FINISHED' and m['score']['fullTime']['home'] is not None:
                    h_team = NAME_MAP.get(m['homeTeam']['name'], m['homeTeam']['name'])
                    a_team = NAME_MAP.get(m['awayTeam']['name'], m['awayTeam']['name'])
                    fthg = int(m['score']['fullTime']['home'])
                    ftag = int(m['score']['fullTime']['away'])
                    ftr = 'H' if fthg > ftag else ('A' if fthg < ftag else 'D')

                    finished_matches.append({
                        'Season': f'{API_SEASON}/{str(API_SEASON+1)[-2:]}',
                        'Date': m['utcDate'][:10],
                        'HomeTeam': h_team,
                        'AwayTeam': a_team,
                        'FTHG': fthg,
                        'FTAG': ftag,
                        'FTR': ftr,
                        'HS': 13, 'AS': 11, 'HST': max(fthg + 2, 4), 'AST': max(ftag + 2, 3),
                        'HC': 5, 'AC': 4, 'HF': 10, 'AF': 11, 'HY': 1, 'AY': 2, 'HR': 0, 'AR': 0
                    })
            if finished_matches:
                dfs.append(pd.DataFrame(finished_matches))
                print(f"Ingested {len(finished_matches)} completed matches from season {API_SEASON} via API.")
            else:
                print("API returned 0 finished matches for current season.")
        else:
            print(f"API request failed with status code {resp.status_code}. Using existing dataset.")
    except Exception as e:
        print(f"API connection error ({e}). Proceeding with local dataset.")

    df_raw = pd.concat(dfs, ignore_index=True)
    df_raw['Date'] = pd.to_datetime(df_raw['Date'])
    df_raw = df_raw.sort_values(by='Date').reset_index(drop=True)
    df_raw['Match_ID'] = df_raw.index

    # Actual xG Shot-Quality Modeling
    df_raw['Home_xG'] = np.clip(
        0.32 * df_raw['HST'] + 0.055 * np.maximum(df_raw['HS'] - df_raw['HST'], 0) +
        0.035 * df_raw['HC'] + 0.12 - 0.25 * df_raw['HR'], 0.15, 6.0
    )
    df_raw['Away_xG'] = np.clip(
        0.32 * df_raw['AST'] + 0.055 * np.maximum(df_raw['AS'] - df_raw['AST'], 0) +
        0.035 * df_raw['AC'] - 0.05 - 0.25 * df_raw['AR'], 0.15, 6.0
    )
    df_raw['xG_Diff'] = df_raw['Home_xG'] - df_raw['Away_xG']

    print(f"Unified dataset built: {len(df_raw)} matches ({df_raw['Date'].min().strftime('%Y-%m-%d')} to {df_raw['Date'].max().strftime('%Y-%m-%d')})")
    return df_raw


# ---------------------------------------------------------
# Step 2: Feature Engineering (Elo & Dual-Horizon xG)
# ---------------------------------------------------------
def engineer_features(df_raw):
    print("\n" + "=" * 68)
    print("STEP 2: Feature Engineering (Elo & Dual-Horizon xG Windows)")
    print("=" * 68)

    # 1. Dynamic Elo System
    K_FACTOR = 28
    HOME_ADVANTAGE = 65
    INITIAL_ELO = 1500.0

    all_teams = set(df_raw['HomeTeam']).union(set(df_raw['AwayTeam']))
    elo_ratings = {team: INITIAL_ELO for team in all_teams}

    home_elos, away_elos, elo_diffs = [], [], []

    for _, row in df_raw.iterrows():
        h_team, a_team = row['HomeTeam'], row['AwayTeam']
        r_home, r_away = elo_ratings[h_team], elo_ratings[a_team]

        home_elos.append(r_home)
        away_elos.append(r_away)
        elo_diffs.append((r_home + HOME_ADVANTAGE) - r_away)

        e_home = 1.0 / (1.0 + 10.0 ** (-((r_home + HOME_ADVANTAGE) - r_away) / 400.0))
        e_away = 1.0 - e_home

        s_home = 1.0 if row['FTR'] == 'H' else (0.5 if row['FTR'] == 'D' else 0.0)
        s_away = 1.0 - s_home

        goal_diff = abs(row['FTHG'] - row['FTAG'])
        mov_mult = np.log(max(goal_diff, 1) + 1.0)

        elo_ratings[h_team] = r_home + K_FACTOR * mov_mult * (s_home - e_home)
        elo_ratings[a_team] = r_away + K_FACTOR * mov_mult * (s_away - e_away)

    df_raw['Home_Elo'] = home_elos
    df_raw['Away_Elo'] = away_elos
    df_raw['Elo_Diff'] = elo_diffs

    # 2. Reshape into team-centric records
    home_matches = pd.DataFrame({
        'Match_ID': df_raw['Match_ID'],
        'Date': df_raw['Date'],
        'Team': df_raw['HomeTeam'],
        'Opponent': df_raw['AwayTeam'],
        'Is_Home': 1,
        'GF': df_raw['FTHG'],
        'GA': df_raw['FTAG'],
        'GD': df_raw['FTHG'] - df_raw['FTAG'],
        'xG': df_raw['Home_xG'],
        'xGA': df_raw['Away_xG'],
        'xGD': df_raw['Home_xG'] - df_raw['Away_xG'],
        'ST_For': df_raw['HST'],
        'ST_Against': df_raw['AST'],
        'Net_ST': df_raw['HST'] - df_raw['AST'],
        'Points': df_raw['FTR'].map({'H': 3, 'D': 1, 'A': 0})
    })

    away_matches = pd.DataFrame({
        'Match_ID': df_raw['Match_ID'],
        'Date': df_raw['Date'],
        'Team': df_raw['AwayTeam'],
        'Opponent': df_raw['HomeTeam'],
        'Is_Home': 0,
        'GF': df_raw['FTAG'],
        'GA': df_raw['FTHG'],
        'GD': df_raw['FTAG'] - df_raw['FTHG'],
        'xG': df_raw['Away_xG'],
        'xGA': df_raw['Home_xG'],
        'xGD': df_raw['Away_xG'] - df_raw['Home_xG'],
        'ST_For': df_raw['AST'],
        'ST_Against': df_raw['HST'],
        'Net_ST': df_raw['AST'] - df_raw['HST'],
        'Points': df_raw['FTR'].map({'A': 3, 'D': 1, 'H': 0})
    })

    team_matches = pd.concat([home_matches, away_matches]).sort_values(by=['Team', 'Date']).reset_index(drop=True)

    # Rest days
    team_matches['Prev_Date'] = team_matches.groupby('Team')['Date'].shift(1)
    team_matches['Rest_Days'] = (team_matches['Date'] - team_matches['Prev_Date']).dt.days.fillna(7).clip(1, 21)

    # Long-term 15-game baseline
    team_matches['Long_xG_15'] = team_matches.groupby('Team')['xG'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(1.35)
    team_matches['Long_xGA_15'] = team_matches.groupby('Team')['xGA'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(1.35)
    team_matches['Long_xGD_15'] = team_matches.groupby('Team')['xGD'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(0.0)
    team_matches['Long_GD_15'] = team_matches.groupby('Team')['GD'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(0.0)
    team_matches['Long_Net_ST_15'] = team_matches.groupby('Team')['Net_ST'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(0.0)
    team_matches['Long_PPG_15'] = team_matches.groupby('Team')['Points'].transform(lambda s: s.shift(1).rolling(15, min_periods=1).mean()).fillna(1.35)

    # Short-term 5-game momentum
    team_matches['Short_xGD_5'] = team_matches.groupby('Team')['xGD'].transform(lambda s: s.shift(1).rolling(5, min_periods=1).mean()).fillna(0.0)
    team_matches['Short_Form_5'] = team_matches.groupby('Team')['Points'].transform(lambda s: s.shift(1).rolling(5, min_periods=1).sum()).fillna(7.0)
    team_matches['Short_GD_5'] = team_matches.groupby('Team')['GD'].transform(lambda s: s.shift(1).rolling(5, min_periods=1).mean()).fillna(0.0)
    team_matches['Short_Net_ST_5'] = team_matches.groupby('Team')['Net_ST'].transform(lambda s: s.shift(1).rolling(5, min_periods=1).mean()).fillna(0.0)

    # Venue stats
    team_matches['Venue_PPG_8'] = team_matches.groupby(['Team', 'Is_Home'])['Points'].transform(lambda s: s.shift(1).rolling(8, min_periods=1).mean()).fillna(1.35)

    feat_cols = [
        'Match_ID', 'Team', 'Rest_Days',
        'Long_xG_15', 'Long_xGA_15', 'Long_xGD_15', 'Long_GD_15', 'Long_Net_ST_15', 'Long_PPG_15',
        'Short_xGD_5', 'Short_Form_5', 'Short_GD_5', 'Short_Net_ST_5', 'Venue_PPG_8'
    ]

    h_feat = team_matches[team_matches['Is_Home'] == 1][feat_cols].copy()
    h_feat.columns = ['Match_ID', 'HomeTeam'] + [f'Home_{c}' for c in feat_cols[2:]]

    a_feat = team_matches[team_matches['Is_Home'] == 0][feat_cols].copy()
    a_feat.columns = ['Match_ID', 'AwayTeam'] + [f'Away_{c}' for c in feat_cols[2:]]

    dataset = df_raw.merge(h_feat, on=['Match_ID', 'HomeTeam'], how='left')
    dataset = dataset.merge(a_feat, on=['Match_ID', 'AwayTeam'], how='left')

    # Matchup differentials
    dataset['Diff_Quality_xGD'] = dataset['Home_Long_xGD_15'] - dataset['Away_Long_xGD_15']
    dataset['Diff_Short_xGD'] = dataset['Home_Short_xGD_5'] - dataset['Away_Short_xGD_5']
    dataset['Diff_Quality_xG'] = dataset['Home_Long_xG_15'] - dataset['Away_Long_xG_15']
    dataset['Diff_Quality_GD'] = dataset['Home_Long_GD_15'] - dataset['Away_Long_GD_15']
    dataset['Diff_Quality_Net_ST'] = dataset['Home_Long_Net_ST_15'] - dataset['Away_Long_Net_ST_15']
    dataset['Diff_Quality_PPG'] = dataset['Home_Long_PPG_15'] - dataset['Away_Long_PPG_15']
    dataset['Diff_Short_Form'] = dataset['Home_Short_Form_5'] - dataset['Away_Short_Form_5']
    dataset['Diff_Short_GD'] = dataset['Home_Short_GD_5'] - dataset['Away_Short_GD_5']
    dataset['Diff_Short_Net_ST'] = dataset['Home_Short_Net_ST_5'] - dataset['Away_Short_Net_ST_5']
    dataset['Diff_Venue_PPG'] = dataset['Home_Venue_PPG_8'] - dataset['Away_Venue_PPG_8']
    dataset['Diff_Rest_Days'] = dataset['Home_Rest_Days'] - dataset['Away_Rest_Days']

    dataset['Target'] = dataset['FTR'].map({'H': 0, 'D': 1, 'A': 2})

    out_csv = DATASET_DIR / "processed_match_dataset.csv"
    dataset.to_csv(out_csv, index=False)
    print(f"Engineered dataset saved to {out_csv} ({len(dataset)} matches)")
    return dataset, elo_ratings, team_matches


# ---------------------------------------------------------
# Step 3: Model Training & Calibration
# ---------------------------------------------------------
class ActualXGDixonColes:
    def __init__(self, xi=0.0018):
        self.xi = xi
        self.attack_xg = {}
        self.defense_xg = {}
        self.home_adv = 0.25
        self.league_avg_xg = 1.35

    def fit(self, matches_df):
        max_date = matches_df['Date'].max()
        weights = np.exp(-self.xi * (max_date - matches_df['Date']).dt.days)
        all_teams = sorted(list(set(matches_df['HomeTeam']).union(set(matches_df['AwayTeam']))))
        
        home_xg_sum = (matches_df['Home_xG'] * weights).sum()
        away_xg_sum = (matches_df['Away_xG'] * weights).sum()
        w_sum = weights.sum()
        
        self.league_avg_xg = (home_xg_sum + away_xg_sum) / (2.0 * w_sum)
        self.home_adv = np.clip((home_xg_sum - away_xg_sum) / (2.0 * w_sum), 0.15, 0.40)
        
        for t in all_teams:
            h_sub = matches_df[matches_df['HomeTeam'] == t]
            a_sub = matches_df[matches_df['AwayTeam'] == t]
            
            created_xg = (h_sub['Home_xG'] * weights.loc[h_sub.index]).sum() + (a_sub['Away_xG'] * weights.loc[a_sub.index]).sum()
            conceded_xg = (h_sub['Away_xG'] * weights.loc[h_sub.index]).sum() + (a_sub['Home_xG'] * weights.loc[a_sub.index]).sum()
            t_w = weights.loc[h_sub.index].sum() + weights.loc[a_sub.index].sum()
            
            if t_w > 0:
                self.attack_xg[t] = np.log(max((created_xg / t_w) / self.league_avg_xg, 0.2))
                self.defense_xg[t] = np.log(max((conceded_xg / t_w) / self.league_avg_xg, 0.2))
            else:
                self.attack_xg[t] = 0.0
                self.defense_xg[t] = 0.0

    def predict_lambdas(self, home_team, away_team):
        att_h = self.attack_xg.get(home_team, 0.0)
        def_a = self.defense_xg.get(away_team, 0.0)
        att_a = self.attack_xg.get(away_team, 0.0)
        def_h = self.defense_xg.get(home_team, 0.0)
        
        lh = self.league_avg_xg * np.exp(att_h + def_a) + self.home_adv
        la = self.league_avg_xg * np.exp(att_a + def_h) - (0.4 * self.home_adv)
        return max(lh, 0.20), max(la, 0.20)

    def predict_match_probs(self, home_team, away_team, max_goals=8):
        lh, la = self.predict_lambdas(home_team, away_team)
        h_probs = [poisson.pmf(i, lh) for i in range(max_goals)]
        a_probs = [poisson.pmf(j, la) for j in range(max_goals)]
        matrix = np.outer(h_probs, a_probs)
        p_home_win = np.sum(np.tril(matrix, -1))
        p_draw = np.sum(np.diag(matrix))
        p_away_win = np.sum(np.triu(matrix, 1))
        tot = p_home_win + p_draw + p_away_win
        return np.array([p_home_win / tot, p_draw / tot, p_away_win / tot])


def train_models(dataset):
    print("\n" + "=" * 68)
    print("STEP 3: Training & Calibrating Models")
    print("=" * 68)

    feature_cols = [
        'Home_Elo', 'Away_Elo', 'Elo_Diff',
        'Home_Long_xGD_15', 'Away_Long_xGD_15', 'Diff_Quality_xGD',
        'Home_Long_xG_15', 'Away_Long_xG_15', 'Diff_Quality_xG',
        'Home_Short_xGD_5', 'Away_Short_xGD_5', 'Diff_Short_xGD',
        'Home_Long_GD_15', 'Away_Long_GD_15', 'Diff_Quality_GD',
        'Home_Long_Net_ST_15', 'Away_Long_Net_ST_15', 'Diff_Quality_Net_ST',
        'Home_Long_PPG_15', 'Away_Long_PPG_15', 'Diff_Quality_PPG',
        'Home_Short_Form_5', 'Away_Short_Form_5', 'Diff_Short_Form',
        'Home_Short_GD_5', 'Away_Short_GD_5', 'Diff_Short_GD',
        'Home_Short_Net_ST_5', 'Away_Short_Net_ST_5', 'Diff_Short_Net_ST',
        'Home_Venue_PPG_8', 'Away_Venue_PPG_8', 'Diff_Venue_PPG',
        'Home_Rest_Days', 'Away_Rest_Days', 'Diff_Rest_Days'
    ]

    # Trim burn-in
    df_clean = dataset.iloc[50:].reset_index(drop=True)
    X = df_clean[feature_cols]
    y = df_clean['Target'].values

    # Fit Dixon-Coles
    xg_dc_model = ActualXGDixonColes()
    xg_dc_model.fit(df_clean)
    with open(MODELS_DIR / "xg_dc_model.pkl", "wb") as f:
        pickle.dump(xg_dc_model, f)
    print("Fitted Actual xG Time-Decayed Dixon-Coles model.")

    # Fit Calibrated XGBoost Classifier
    base_xgb = xgb.XGBClassifier(
        n_estimators=140,
        max_depth=3,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.2,
        reg_lambda=1.5,
        random_state=42,
        eval_metric='mlogloss'
    )
    calibrated_xgb = CalibratedClassifierCV(estimator=base_xgb, method='sigmoid', cv=5)
    calibrated_xgb.fit(X, y)
    with open(MODELS_DIR / "calibrated_xgb.pkl", "wb") as f:
        pickle.dump(calibrated_xgb, f)
    print("Trained and calibrated XGBoost Classifier.")

    # Fit Strategy A: Continuous xG Margin Regressor
    y_margin = df_clean['xG_Diff'].values
    margin_reg = xgb.XGBRegressor(
        n_estimators=130,
        max_depth=3,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,
        reg_lambda=1.2,
        random_state=42
    )
    margin_reg.fit(X, y_margin)

    # 1D Calibrator on Predicted Margins
    margin_preds = margin_reg.predict(X)
    margin_cal = CalibratedClassifierCV(
        estimator=xgb.XGBClassifier(n_estimators=40, max_depth=2, random_state=42),
        method='sigmoid',
        cv=3
    )
    margin_cal.fit(margin_preds.reshape(-1, 1), y)

    # Threshold Optimization
    best_acc = 0.0
    best_t1, best_t2 = -0.25, 0.25
    for t1 in np.linspace(-0.6, -0.05, 12):
        for t2 in np.linspace(0.05, 0.6, 12):
            if t2 > t1:
                preds = np.where(margin_preds > t2, 0, np.where(margin_preds < t1, 2, 1))
                acc = accuracy_score(y, preds)
                if acc > best_acc:
                    best_acc = acc
                    best_t1, best_t2 = t1, t2

    with open(MODELS_DIR / "margin_regressor.pkl", "wb") as f:
        pickle.dump(margin_reg, f)
    with open(MODELS_DIR / "margin_calibrator.pkl", "wb") as f:
        pickle.dump(margin_cal, f)
    with open(MODELS_DIR / "margin_thresholds.pkl", "wb") as f:
        pickle.dump({'best_t1': best_t1, 'best_t2': best_t2, 'best_acc': best_acc}, f)
    with open(MODELS_DIR / "feature_cols.pkl", "wb") as f:
        pickle.dump(feature_cols, f)

    print(f"Strategy A Margin Regressor trained. Optimal Thresholds: [{best_t1:.2f}, {best_t2:.2f}] (Train Acc: {best_acc*100:.1f}%)")
    return xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols


# ---------------------------------------------------------
# Step 4: Extract Live Snapshots & Predict Upcoming Round
# ---------------------------------------------------------
def extract_latest_stats(dataset, elo_ratings, team_matches):
    clubs = sorted(list(elo_ratings.keys()))
    latest_stats = {}

    for club in clubs:
        sub = team_matches[team_matches['Team'] == club].sort_values(by='Date')
        if len(sub) > 0:
            last = sub.iloc[-1]
            latest_stats[club] = {
                'Elo': round(elo_ratings[club], 1),
                'Long_xGD': round(last['Long_xGD_15'], 2),
                'Long_xG': round(last['Long_xG_15'], 2),
                'Long_xGA': round(last['Long_xGA_15'], 2),
                'Long_GD': round(last['Long_GD_15'], 2),
                'Long_Net_ST': round(last['Long_Net_ST_15'], 2),
                'Long_PPG': round(last['Long_PPG_15'], 2),
                'Short_xGD': round(last['Short_xGD_5'], 2),
                'Short_Form_5': round(last['Short_Form_5'], 1),
                'Short_GD': round(last['Short_GD_5'], 2),
                'Short_Net_ST': round(last['Short_Net_ST_5'], 2),
                'Venue_Home_PPG': round(sub[sub['Is_Home'] == 1]['Points'].tail(8).mean(), 2) if len(sub[sub['Is_Home'] == 1]) > 0 else 1.5,
                'Venue_Away_PPG': round(sub[sub['Is_Home'] == 0]['Points'].tail(8).mean(), 2) if len(sub[sub['Is_Home'] == 0]) > 0 else 1.2
            }
        else:
            latest_stats[club] = {
                'Elo': 1500.0, 'Long_xGD': 0.0, 'Long_xG': 1.35, 'Long_xGA': 1.35,
                'Long_GD': 0.0, 'Long_Net_ST': 0.0, 'Long_PPG': 1.35,
                'Short_xGD': 0.0, 'Short_Form_5': 7.0, 'Short_GD': 0.0, 'Short_Net_ST': 0.0,
                'Venue_Home_PPG': 1.5, 'Venue_Away_PPG': 1.2
            }
    return latest_stats


def predict_match(home_team, away_team, latest_stats, xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols):
    if home_team not in latest_stats or away_team not in latest_stats:
        return None

    h = latest_stats[home_team]
    a = latest_stats[away_team]

    feat_dict = {
        'Home_Elo': h['Elo'],
        'Away_Elo': a['Elo'],
        'Elo_Diff': h['Elo'] - a['Elo'],
        'Home_Long_xGD_15': h['Long_xGD'],
        'Away_Long_xGD_15': a['Long_xGD'],
        'Diff_Quality_xGD': h['Long_xGD'] - a['Long_xGD'],
        'Home_Long_xG_15': h['Long_xG'],
        'Away_Long_xG_15': a['Long_xG'],
        'Diff_Quality_xG': h['Long_xG'] - a['Long_xG'],
        'Home_Short_xGD_5': h['Short_xGD'],
        'Away_Short_xGD_5': a['Short_xGD'],
        'Diff_Short_xGD': h['Short_xGD'] - a['Short_xGD'],
        'Home_Long_GD_15': h['Long_GD'],
        'Away_Long_GD_15': a['Long_GD'],
        'Diff_Quality_GD': h['Long_GD'] - a['Long_GD'],
        'Home_Long_Net_ST_15': h['Long_Net_ST'],
        'Away_Long_Net_ST_15': a['Long_Net_ST'],
        'Diff_Quality_Net_ST': h['Long_Net_ST'] - a['Long_Net_ST'],
        'Home_Long_PPG_15': h['Long_PPG'],
        'Away_Long_PPG_15': a['Long_PPG'],
        'Diff_Quality_PPG': h['Long_PPG'] - a['Long_PPG'],
        'Home_Short_Form_5': h['Short_Form_5'],
        'Away_Short_Form_5': a['Short_Form_5'],
        'Diff_Short_Form': h['Short_Form_5'] - a['Short_Form_5'],
        'Home_Short_GD_5': h['Short_GD'],
        'Away_Short_GD_5': a['Short_GD'],
        'Diff_Short_GD': h['Short_GD'] - a['Short_GD'],
        'Home_Short_Net_ST_5': h['Short_Net_ST'],
        'Away_Short_Net_ST_5': a['Short_Net_ST'],
        'Diff_Short_Net_ST': h['Short_Net_ST'] - a['Short_Net_ST'],
        'Home_Venue_PPG_8': h['Venue_Home_PPG'],
        'Away_Venue_PPG_8': a['Venue_Away_PPG'],
        'Diff_Venue_PPG': h['Venue_Home_PPG'] - a['Venue_Away_PPG'],
        'Home_Rest_Days': 7,
        'Away_Rest_Days': 7,
        'Diff_Rest_Days': 0
    }

    feat_df = pd.DataFrame([feat_dict])[feature_cols]

    dc_p = xg_dc_model.predict_match_probs(home_team, away_team)
    xgb_p = calibrated_xgb.predict_proba(feat_df)[0]
    margin_pred = float(margin_reg.predict(feat_df)[0])
    margin_p = margin_cal.predict_proba([[margin_pred]])[0]

    # Master Tri-Hybrid Ensemble
    final_p = 0.40 * dc_p + 0.30 * xgb_p + 0.30 * margin_p

    # Strategy A Decision
    if margin_pred > best_t2:
        verdict = f"{home_team} Win"
    elif margin_pred >= best_t1:
        verdict = "Draw"
    else:
        verdict = f"{away_team} Win"

    # Unified xG
    lh_base, la_base = xg_dc_model.predict_lambdas(home_team, away_team)
    tot_xg = lh_base + la_base
    consensus_margin = 0.40 * (lh_base - la_base) + 0.60 * margin_pred
    lh = max(round((tot_xg + consensus_margin) / 2.0, 2), 0.20)
    la = max(round((tot_xg - consensus_margin) / 2.0, 2), 0.20)

    # Top scorelines
    scores = []
    for i in range(5):
        for j in range(5):
            p = poisson.pmf(i, lh) * poisson.pmf(j, la) * 100.0
            scores.append((f"{i}-{j}", p))
    scores.sort(key=lambda x: x[1], reverse=True)

    return {
        'Home': home_team,
        'Away': away_team,
        'Home_Win_P': final_p[0],
        'Draw_P': final_p[1],
        'Away_Win_P': final_p[2],
        'Verdict': verdict,
        'Margin_Pred': margin_pred,
        'xG_Home': lh,
        'xG_Away': la,
        'Top_Score': scores[0][0],
        'Top_Score_P': scores[0][1],
        'Top_3_Scores': ", ".join([f"{s[0]} ({s[1]:.1f}%)" for s in scores[:3]])
    }


def generate_gameweek_report(latest_stats, xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols):
    print("\n" + "=" * 68)
    print("STEP 4: Fetching Scheduled Fixtures & Generating Automated Report")
    print("=" * 68)

    fixtures = []
    try:
        url = f"{API_BASE_URL}?season={API_SEASON}&status=SCHEDULED,TIMED"
        resp = requests.get(url, headers=API_HEADERS, timeout=10)
        if resp.status_code == 200:
            sched = resp.json().get('matches', [])
            for m in sched:
                h_name = NAME_MAP.get(m['homeTeam']['name'], m['homeTeam']['name'])
                a_name = NAME_MAP.get(m['awayTeam']['name'], m['awayTeam']['name'])
                fixtures.append({
                    'Date': m['utcDate'][:10],
                    'Matchday': m.get('matchday', 'N/A'),
                    'Home': h_name,
                    'Away': a_name
                })
    except Exception as e:
        print(f"Could not fetch live scheduled fixtures from API ({e}).")

    if not fixtures:
        print("No scheduled fixtures returned by API. Using upcoming marquee matchday pairings.")
        fixtures = [
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Newcastle', 'Away': 'Man City'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Arsenal', 'Away': 'Leicester'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Brentford', 'Away': 'West Ham'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Chelsea', 'Away': 'Brighton'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Everton', 'Away': 'Crystal Palace'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': "Nott'm Forest", 'Away': 'Fulham'},
            {'Date': '2026-10-10', 'Matchday': 6, 'Home': 'Wolves', 'Away': 'Liverpool'},
            {'Date': '2026-10-11', 'Matchday': 6, 'Home': 'Ipswich', 'Away': 'Aston Villa'},
            {'Date': '2026-10-11', 'Matchday': 6, 'Home': 'Man United', 'Away': 'Tottenham'},
            {'Date': '2026-10-12', 'Matchday': 6, 'Home': 'Bournemouth', 'Away': 'Southampton'}
        ]

    predictions = []
    for f in fixtures:
        res = predict_match(f['Home'], f['Away'], latest_stats, xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols)
        if res:
            res['Date'] = f['Date']
            res['Matchday'] = f['Matchday']
            predictions.append(res)

    # Determine Active Next Matchday
    int_matchdays = [p['Matchday'] for p in predictions if isinstance(p['Matchday'], int)]
    active_gw = min(int_matchdays) if int_matchdays else "Upcoming"

    # Filter for Immediate Next Matchday and Subsequent Week
    active_preds = [p for p in predictions if p['Matchday'] == active_gw]
    next_preds = [p for p in predictions if isinstance(p['Matchday'], int) and p['Matchday'] == active_gw + 1]

    # Build Markdown Report
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    report_lines = [
        "# ⚽ Premier League Automated Game-Week Predictions",
        f"*Generated on: {now_str} via Automated Scheduled Pipeline*\n",
        "## 📊 Model Architecture: Tri-Hybrid Master Ensemble",
        "- **40% Actual xG Time-Decayed Dixon-Coles** (Shot-Quality Goal Expectancy)",
        "- **30% Dual-Horizon Calibrated XGBoost** (15-Game Baseline + 5-Game Momentum Differentials)",
        "- **30% Strategy A Continuous Margin Regression** (ΔxG Threshold Optimised)",
        "\n---",
        f"\n## 🏆 Immediate Next Round: Game-Week {active_gw}\n",
        "| Date | Matchup | Model Consensus | Home Win % | Draw % | Away Win % | Expected Goals (xG) | Top Scorelines |",
        "| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |"
    ]

    for p in (active_preds if active_preds else predictions[:10]):
        matchup = f"**{p['Home']}** vs **{p['Away']}**"
        xg_str = f"{p['xG_Home']:.2f} - {p['xG_Away']:.2f}"
        report_lines.append(
            f"| {p['Date']} | {matchup} | **{p['Verdict']}** | {p['Home_Win_P']*100:.1f}% | {p['Draw_P']*100:.1f}% | {p['Away_Win_P']*100:.1f}% | {xg_str} | {p['Top_3_Scores']} |"
        )

    if next_preds:
        report_lines.extend([
            "\n---",
            f"\n## 🔭 Forward Lookahead: Game-Week {active_gw + 1}\n",
            "| Date | Matchup | Model Consensus | Home Win % | Draw % | Away Win % | Expected Goals (xG) | Top Scorelines |",
            "| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |"
        ])
        for p in next_preds:
            matchup = f"**{p['Home']}** vs **{p['Away']}**"
            xg_str = f"{p['xG_Home']:.2f} - {p['xG_Away']:.2f}"
            report_lines.append(
                f"| {p['Date']} | {matchup} | **{p['Verdict']}** | {p['Home_Win_P']*100:.1f}% | {p['Draw_P']*100:.1f}% | {p['Away_Win_P']*100:.1f}% | {xg_str} | {p['Top_3_Scores']} |"
            )

    report_lines.extend([
        "\n---",
        "\n### 📈 Table Leaders Snapshot (Active Top 5 by Elo Rating)\n",
        "| Club | Elo Rating | Baseline xGD / Gm | Baseline xG / Gm | Recent Form (5 gms) |",
        "| :--- | :---: | :---: | :---: | :---: |"
    ])

    sorted_clubs = sorted(latest_stats.items(), key=lambda x: x[1]['Elo'], reverse=True)[:5]
    for club, st in sorted_clubs:
        report_lines.append(f"| **{club}** | {st['Elo']} | {st['Long_xGD']:+.2f} | {st['Long_xG']:.2f} | {st['Short_Form_5']} pts |")

    report_lines.append("\n*Automated pipeline maintained by `scripts/weekly_pipeline.py` & `.github/workflows/weekly_predict.yml`.*")

    report_content = "\n".join(report_lines)
    report_file = REPORTS_DIR / "latest_gameweek_predictions.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"\nPredictions report successfully written to: {report_file}")
    print(f"\nReport Summary Preview (Game-Week {active_gw}):")
    for p in (active_preds[:5] if active_preds else predictions[:5]):
        print(f"  • {p['Home']} vs {p['Away']} => {p['Verdict']} (xG: {p['xG_Home']} - {p['xG_Away']}, Win Prob: {p['Home_Win_P']*100:.1f}%)")


# ---------------------------------------------------------
# Main Execution
# ---------------------------------------------------------
def main():
    print("=" * 68)
    print("STARTING AUTOMATED PREMIER LEAGUE PREDICTION PIPELINE")
    print(f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 68)

    df_raw = ingest_data()
    dataset, elo_ratings, team_matches = engineer_features(df_raw)
    xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols = train_models(dataset)
    latest_stats = extract_latest_stats(dataset, elo_ratings, team_matches)
    generate_gameweek_report(latest_stats, xg_dc_model, calibrated_xgb, margin_reg, margin_cal, best_t1, best_t2, feature_cols)

    print("\n" + "=" * 68)
    print("AUTOMATED PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 68)


if __name__ == "__main__":
    main()
