export interface TeamSnapshot {
  name: string;
  elo: number;
  long_xgd: number;
  long_xg: number;
  long_xga: number;
  long_gd: number;
  long_net_st: number;
  long_ppg: number;
  short_xgd: number;
  short_form_5: number;
  short_gd: number;
  short_net_st: number;
  venue_home_ppg: number;
  venue_away_ppg: number;
}

export interface ScoreProbability {
  score: string;
  prob: number;
}

export interface PredictionResponse {
  home_team: string;
  away_team: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  margin_pred: number;
  verdict: string;
  top_scores: ScoreProbability[];
  tale_of_the_tape: {
    home: TeamSnapshot;
    away: TeamSnapshot;
  };
}

export interface GameWeekMatch {
  date: string;
  matchday: number | string;
  home_team: string;
  away_team: string;
  verdict: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  top_scores: string;
}

export interface RankingItem {
  rank: number;
  team: string;
  elo: number;
  xgd: number;
  xg_created: number;
  xg_conceded: number;
  form_pts: number;
  net_st: number;
}

export interface ClubInfo {
  name: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  stadium: string;
}
