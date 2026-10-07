#!/usr/bin/env python3
"""
FastAPI Backend for Premier League Match Prediction Platform
=============================================================
Provides REST endpoints for:
- Live match outcome prediction (Tri-Hybrid Ensemble)
- Consensus Expected Goals (xG) forecasting
- Top exact score probabilities
- Tale of the Tape statistical comparisons
- Active Game-Week fixture briefings
- Real-time Elo Power Rankings
"""

import os
import sys
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from scipy.stats import poisson
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import Dixon-Coles model class for unpickling
from scripts.weekly_pipeline import ActualXGDixonColes

app = FastAPI(
    title="Premier League Match Prediction API",
    description="Machine Learning & Actual xG Quantitative Sports Analytics API",
    version="2.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
MODELS_DIR = ROOT_DIR / "saved_models"
DATASET_PATH = ROOT_DIR / "dataset" / "processed_match_dataset.csv"
REPORTS_PATH = ROOT_DIR / "reports" / "latest_gameweek_predictions.md"
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

# Global state
MODELS: Dict[str, Any] = {}
LATEST_TEAM_STATS: Dict[str, Dict[str, Any]] = {}
ELO_RATINGS: Dict[str, float] = {}


# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------
class PredictionRequest(BaseModel):
    home_team: str = Field(..., example="Arsenal")
    away_team: str = Field(..., example="Chelsea")
    rest_days_home: int = Field(7, ge=1, le=30, example=7)
    rest_days_away: int = Field(7, ge=1, le=30, example=7)


class ScoreProbability(BaseModel):
    score: str
    prob: float


class TeamSnapshot(BaseModel):
    name: str
    elo: float
    long_xgd: float
    long_xg: float
    long_xga: float
    long_gd: float
    long_net_st: float
    long_ppg: float
    short_xgd: float
    short_form_5: float
    short_gd: float
    short_net_st: float
    venue_home_ppg: float
    venue_away_ppg: float


class PredictionResponse(BaseModel):
    home_team: str
    away_team: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    expected_home_goals: float
    expected_away_goals: float
    margin_pred: float
    verdict: str
    top_scores: List[ScoreProbability]
    tale_of_the_tape: Dict[str, TeamSnapshot]


class GameWeekMatch(BaseModel):
    date: str
    matchday: Any
    home_team: str
    away_team: str
    verdict: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    expected_home_goals: float
    expected_away_goals: float
    top_scores: str


class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == 'ActualXGDixonColes':
            return ActualXGDixonColes
        return super().find_class(module, name)


# ---------------------------------------------------------
# Startup: Load Models & Team Statistics
# ---------------------------------------------------------
def load_production_models():
    global MODELS, LATEST_TEAM_STATS, ELO_RATINGS

    print("Loading ML models from saved_models/...")
    with open(MODELS_DIR / "calibrated_xgb.pkl", "rb") as f:
        MODELS["xgb"] = pickle.load(f)
    with open(MODELS_DIR / "margin_regressor.pkl", "rb") as f:
        MODELS["margin_reg"] = pickle.load(f)
    with open(MODELS_DIR / "margin_calibrator.pkl", "rb") as f:
        MODELS["margin_cal"] = pickle.load(f)
    with open(MODELS_DIR / "margin_thresholds.pkl", "rb") as f:
        MODELS["thresholds"] = pickle.load(f)
    with open(MODELS_DIR / "feature_cols.pkl", "rb") as f:
        MODELS["feature_cols"] = pickle.load(f)
    with open(MODELS_DIR / "xg_dc_model.pkl", "rb") as f:
        MODELS["dc"] = CustomUnpickler(f).load()

    print("Extracting club states from dataset/processed_match_dataset.csv...")
    if DATASET_PATH.exists():
        df = pd.read_csv(DATASET_PATH)
        df['Date'] = pd.to_datetime(df['Date'])

        # Get latest Elo per club
        all_teams = set(df['HomeTeam']).union(set(df['AwayTeam']))
        for team in all_teams:
            h_last = df[df['HomeTeam'] == team].tail(1)
            a_last = df[df['AwayTeam'] == team].tail(1)
            
            h_date = h_last['Date'].values[0] if len(h_last) > 0 else pd.Timestamp.min
            a_date = a_last['Date'].values[0] if len(a_last) > 0 else pd.Timestamp.min

            if h_date >= a_date and len(h_last) > 0:
                row = h_last.iloc[0]
                ELO_RATINGS[team] = round(float(row['Home_Elo']), 1)
                LATEST_TEAM_STATS[team] = {
                    'name': team,
                    'elo': round(float(row['Home_Elo']), 1),
                    'long_xgd': round(float(row.get('Home_Long_xGD_15', 0.0)), 2),
                    'long_xg': round(float(row.get('Home_Long_xG_15', 1.35)), 2),
                    'long_xga': round(float(row.get('Home_Long_xG_15', 1.35) - row.get('Home_Long_xGD_15', 0.0)), 2),
                    'long_gd': round(float(row.get('Home_Long_GD_15', 0.0)), 2),
                    'long_net_st': round(float(row.get('Home_Long_Net_ST_15', 0.0)), 2),
                    'long_ppg': round(float(row.get('Home_Long_PPG_15', 1.35)), 2),
                    'short_xgd': round(float(row.get('Home_Short_xGD_5', 0.0)), 2),
                    'short_form_5': round(float(row.get('Home_Short_Form_5', 7.0)), 1),
                    'short_gd': round(float(row.get('Home_Short_GD_5', 0.0)), 2),
                    'short_net_st': round(float(row.get('Home_Short_Net_ST_5', 0.0)), 2),
                    'venue_home_ppg': round(float(row.get('Home_Venue_PPG_8', 1.5)), 2),
                    'venue_away_ppg': 1.2
                }
            elif len(a_last) > 0:
                row = a_last.iloc[0]
                ELO_RATINGS[team] = round(float(row['Away_Elo']), 1)
                LATEST_TEAM_STATS[team] = {
                    'name': team,
                    'elo': round(float(row['Away_Elo']), 1),
                    'long_xgd': round(float(row.get('Away_Long_xGD_15', 0.0)), 2),
                    'long_xg': round(float(row.get('Away_Long_xG_15', 1.35)), 2),
                    'long_xga': round(float(row.get('Away_Long_xG_15', 1.35) - row.get('Away_Long_xGD_15', 0.0)), 2),
                    'long_gd': round(float(row.get('Away_Long_GD_15', 0.0)), 2),
                    'long_net_st': round(float(row.get('Away_Long_Net_ST_15', 0.0)), 2),
                    'long_ppg': round(float(row.get('Away_Long_PPG_15', 1.35)), 2),
                    'short_xgd': round(float(row.get('Away_Short_xGD_5', 0.0)), 2),
                    'short_form_5': round(float(row.get('Away_Short_Form_5', 7.0)), 1),
                    'short_gd': round(float(row.get('Away_Short_GD_5', 0.0)), 2),
                    'short_net_st': round(float(row.get('Away_Short_Net_ST_5', 0.0)), 2),
                    'venue_home_ppg': 1.5,
                    'venue_away_ppg': round(float(row.get('Away_Venue_PPG_8', 1.2)), 2)
                }

    print(f"Loaded {len(LATEST_TEAM_STATS)} clubs into memory.")


@app.on_event("startup")
def startup_event():
    load_production_models()


# ---------------------------------------------------------
# Prediction Core Logic
# ---------------------------------------------------------
def run_prediction(home_team: str, away_team: str, rest_home: int = 7, rest_away: int = 7) -> Dict[str, Any]:
    if home_team not in LATEST_TEAM_STATS or away_team not in LATEST_TEAM_STATS:
        raise HTTPException(
            status_code=404,
            detail=f"Team not found in database. Available clubs: {list(LATEST_TEAM_STATS.keys())}"
        )

    h = LATEST_TEAM_STATS[home_team]
    a = LATEST_TEAM_STATS[away_team]

    feat_dict = {
        'Home_Elo': h['elo'],
        'Away_Elo': a['elo'],
        'Elo_Diff': h['elo'] - a['elo'],
        'Home_Long_xGD_15': h['long_xgd'],
        'Away_Long_xGD_15': a['long_xgd'],
        'Diff_Quality_xGD': h['long_xgd'] - a['long_xgd'],
        'Home_Long_xG_15': h['long_xg'],
        'Away_Long_xG_15': a['long_xg'],
        'Diff_Quality_xG': h['long_xg'] - a['long_xg'],
        'Home_Short_xGD_5': h['short_xgd'],
        'Away_Short_xGD_5': a['short_xgd'],
        'Diff_Short_xGD': h['short_xgd'] - a['short_xgd'],
        'Home_Long_GD_15': h['long_gd'],
        'Away_Long_GD_15': a['long_gd'],
        'Diff_Quality_GD': h['long_gd'] - a['long_gd'],
        'Home_Long_Net_ST_15': h['long_net_st'],
        'Away_Long_Net_ST_15': a['long_net_st'],
        'Diff_Quality_Net_ST': h['long_net_st'] - a['long_net_st'],
        'Home_Long_PPG_15': h['long_ppg'],
        'Away_Long_PPG_15': a['long_ppg'],
        'Diff_Quality_PPG': h['long_ppg'] - a['long_ppg'],
        'Home_Short_Form_5': h['short_form_5'],
        'Away_Short_Form_5': a['short_form_5'],
        'Diff_Short_Form': h['short_form_5'] - a['short_form_5'],
        'Home_Short_GD_5': h['short_gd'],
        'Away_Short_GD_5': a['short_gd'],
        'Diff_Short_GD': h['short_gd'] - a['short_gd'],
        'Home_Short_Net_ST_5': h['short_net_st'],
        'Away_Short_Net_ST_5': a['short_net_st'],
        'Diff_Short_Net_ST': h['short_net_st'] - a['short_net_st'],
        'Home_Venue_PPG_8': h['venue_home_ppg'],
        'Away_Venue_PPG_8': a['venue_away_ppg'],
        'Diff_Venue_PPG': h['venue_home_ppg'] - a['venue_away_ppg'],
        'Home_Rest_Days': rest_home,
        'Away_Rest_Days': rest_away,
        'Diff_Rest_Days': rest_home - rest_away
    }

    feature_cols = MODELS["feature_cols"]
    feat_df = pd.DataFrame([feat_dict])[feature_cols]

    # Model inference
    dc_p = MODELS["dc"].predict_match_probs(home_team, away_team)
    xgb_p = MODELS["xgb"].predict_proba(feat_df)[0]
    margin_pred = float(MODELS["margin_reg"].predict(feat_df)[0])
    margin_p = MODELS["margin_cal"].predict_proba([[margin_pred]])[0]

    # Tri-Hybrid Ensemble
    final_p = 0.40 * dc_p + 0.30 * xgb_p + 0.30 * margin_p

    # Strategy A decision
    t1 = MODELS["thresholds"]["best_t1"]
    t2 = MODELS["thresholds"]["best_t2"]
    if margin_pred > t2:
        verdict = f"{home_team.upper()} WIN"
    elif margin_pred >= t1:
        verdict = "COMPETITIVE DRAW"
    else:
        verdict = f"{away_team.upper()} WIN"

    # Consensus Expected Goals
    lh_base, la_base = MODELS["dc"].predict_lambdas(home_team, away_team)
    tot_xg = lh_base + la_base
    consensus_margin = 0.40 * (lh_base - la_base) + 0.60 * margin_pred
    lh = max(round((tot_xg + consensus_margin) / 2.0, 2), 0.20)
    la = max(round((tot_xg - consensus_margin) / 2.0, 2), 0.20)

    # Top 5 scorelines
    scores = []
    for i in range(6):
        for j in range(6):
            p = poisson.pmf(i, lh) * poisson.pmf(j, la) * 100.0
            scores.append({'score': f"{i} - {j}", 'prob': float(round(p, 1))})
    scores.sort(key=lambda x: x['prob'], reverse=True)

    return {
        'home_team': home_team,
        'away_team': away_team,
        'home_win_prob': round(float(final_p[0]), 3),
        'draw_prob': round(float(final_p[1]), 3),
        'away_win_prob': round(float(final_p[2]), 3),
        'expected_home_goals': float(lh),
        'expected_away_goals': float(la),
        'margin_pred': round(margin_pred, 2),
        'verdict': verdict,
        'top_scores': scores[:5],
        'tale_of_the_tape': {
            'home': TeamSnapshot(**h),
            'away': TeamSnapshot(**a)
        }
    }


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": list(MODELS.keys()),
        "clubs_registered": len(LATEST_TEAM_STATS)
    }


@app.get("/api/teams")
def get_teams():
    """Returns sorted list of all clubs with current Elo and baseline stats."""
    sorted_teams = sorted(
        LATEST_TEAM_STATS.values(),
        key=lambda x: x['elo'],
        reverse=True
    )
    return {"teams": sorted_teams}


@app.post("/api/predict", response_model=PredictionResponse)
def predict_match_endpoint(req: PredictionRequest):
    """Predicts a match outcome between home_team and away_team."""
    return run_prediction(
        home_team=req.home_team,
        away_team=req.away_team,
        rest_home=req.rest_days_home,
        rest_away=req.rest_days_away
    )


@app.get("/api/rankings")
def get_power_rankings():
    """Returns clubs ranked by dynamic Elo ratings and rolling actual xGD."""
    clubs = list(LATEST_TEAM_STATS.values())
    sorted_clubs = sorted(clubs, key=lambda x: x['elo'], reverse=True)
    return {
        "rankings": [
            {
                "rank": idx + 1,
                "team": c["name"],
                "elo": c["elo"],
                "xgd": c["long_xgd"],
                "xg_created": c["long_xg"],
                "xg_conceded": c["long_xga"],
                "form_pts": c["short_form_5"],
                "net_st": c["long_net_st"]
            }
            for idx, c in enumerate(sorted_clubs)
        ]
    }


@app.get("/api/gameweek")
def get_gameweek_fixtures():
    """Returns upcoming game-week fixtures with precomputed forecasts."""
    fixtures = [
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Arsenal', 'away': 'Leeds United FC'},
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Sunderland AFC', 'away': 'Brighton'},
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Chelsea', 'away': 'Bournemouth'},
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Ipswich', 'away': 'Fulham'},
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Aston Villa', 'away': 'Brentford'},
        {'date': '2026-10-10', 'matchday': 6, 'home': 'Man United', 'away': 'Tottenham'},
        {'date': '2026-10-11', 'matchday': 6, 'home': 'Hull City AFC', 'away': 'Everton'},
        {'date': '2026-10-11', 'matchday': 6, 'home': 'Crystal Palace', 'away': "Nott'm Forest"},
        {'date': '2026-10-11', 'matchday': 6, 'home': 'Liverpool', 'away': 'Man City'},
        {'date': '2026-10-12', 'matchday': 6, 'home': 'Coventry City FC', 'away': 'Newcastle'}
    ]

    results = []
    for f in fixtures:
        try:
            pred = run_prediction(f['home'], f['away'])
            results.append({
                'date': f['date'],
                'matchday': f['matchday'],
                'home_team': f['home'],
                'away_team': f['away'],
                'verdict': pred['verdict'],
                'home_win_prob': pred['home_win_prob'],
                'draw_prob': pred['draw_prob'],
                'away_win_prob': pred['away_win_prob'],
                'expected_home_goals': pred['expected_home_goals'],
                'expected_away_goals': pred['expected_away_goals'],
                'top_scores': ", ".join([f"{s['score']} ({s['prob']}%)" for s in pred['top_scores'][:3]])
            })
        except Exception:
            continue

    return {"gameweek": 6, "fixtures": results}


# ---------------------------------------------------------
# Static Files / Production Frontend Serving
# ---------------------------------------------------------
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        index_file = FRONTEND_DIST / "index.html"
        requested = FRONTEND_DIST / full_path
        if requested.exists() and requested.is_file():
            return FileResponse(requested)
        return FileResponse(index_file)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
