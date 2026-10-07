import { useState, useEffect } from 'react';
import type { PredictionResponse, TeamSnapshot } from '../types';
import { CLUBS_DATA, getClubInfo } from '../data/clubs';
import { ProbabilityBar } from './ProbabilityBar';
import { ScorelineGrid } from './ScorelineGrid';
import { TaleOfTheTape } from './TaleOfTheTape';
import { Flame, ArrowRightLeft, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface MatchArenaProps {
  teams: TeamSnapshot[];
}

export const MatchArena: React.FC<MatchArenaProps> = ({ teams }) => {
  const [homeTeam, setHomeTeam] = useState<string>('Arsenal');
  const [awayTeam, setAwayTeam] = useState<string>('Chelsea');
  const [restHome, setRestHome] = useState<number>(7);
  const [restAway, setRestAway] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  // Club names list
  const clubNames = teams.length > 0 ? teams.map((t) => t.name) : Object.keys(CLUBS_DATA);

  const fetchPrediction = async (h: string, a: string, rh: number, ra: number) => {
    if (h === a) {
      setError('Please select two different clubs for the matchup.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_team: h,
          away_team: a,
          rest_days_home: rh,
          rest_days_away: ra,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: PredictionResponse = await res.json();
      setPrediction(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch prediction from server. Ensure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Initial prediction on load
  useEffect(() => {
    fetchPrediction(homeTeam, awayTeam, restHome, restAway);
  }, []);

  const handleSwap = () => {
    const temp = homeTeam;
    setHomeTeam(awayTeam);
    setAwayTeam(temp);
    fetchPrediction(awayTeam, temp, restAway, restHome);
  };

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrediction(homeTeam, awayTeam, restHome, restAway);
  };

  const homeClub = getClubInfo(homeTeam);
  const awayClub = getClubInfo(awayTeam);

  return (
    <div className="arena-page">
      <section className="arena-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> PREMIER LEAGUE · MATCH CENTRE</div>
          <h1 className="arena-title">Every fixture has <span>a story.</span></h1>
          <p className="arena-subtitle">
            Put two sides head to head. Our xG-powered ensemble turns form, strength and rest into a match forecast.
          </p>
        </div>
        <div className="model-status">
          <span className="eyebrow-dot" />
          <span><strong>3-model ensemble</strong><br />Dixon–Coles · XGBoost · xG margin</span>
        </div>
      </section>

      <section className="builder-card" aria-labelledby="matchup-title">
        <form onSubmit={handlePredictSubmit}>
          <div className="builder-topline">
            <div>
              <div id="matchup-title" className="builder-label">Build your matchup</div>
              <div className="builder-caption">Choose the sides and account for recovery time.</div>
            </div>
            <span className="builder-step"><strong>01</strong> / MATCH SETUP</span>
          </div>

          <div className="matchup-row">
            {/* Home Club Selector */}
            <div className="club-picker home-side">
              <div className="club-picker-head">
                <span className="club-side-label">HOME SIDE</span>
                <span className="home-advantage">+65 ELO HOME ADVANTAGE</span>
              </div>
              <div className="club-identity">
                <span className="club-crest" aria-hidden="true">{homeClub.badgeEmoji}</span>
                <div className="club-select-wrap">
                <select
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  aria-label="Choose home club"
                  className="club-select"
                >
                  {clubNames.map((name) => (
                    <option key={`home-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                  <div className="club-venue">{homeClub.stadium}</div>
                </div>
              </div>
              <div className="club-meta">
                <span>Recovery window</span>
                <label className="rest-control">
                  <span className="sr-only">Home club rest days</span>
                  <select
                    value={restHome}
                    onChange={(e) => setRestHome(Number(e.target.value))}
                    aria-label="Home club rest days"
                    className="rest-select"
                  >
                    {[3, 4, 5, 6, 7, 10, 14].map((d) => (
                      <option key={`rest-h-${d}`} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Swap Button & VS Divider */}
            <div className="swap-column">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Home/Away"
                aria-label="Swap home and away clubs"
                className="swap-button"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
              <span className="versus-label">VERSUS</span>
            </div>

            {/* Away Club Selector */}
            <div className="club-picker away-side">
              <div className="club-picker-head">
                <span className="club-side-label">AWAY SIDE</span>
              </div>
              <div className="club-identity">
                <span className="club-crest" aria-hidden="true">{awayClub.badgeEmoji}</span>
                <div className="club-select-wrap">
                <select
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  aria-label="Choose away club"
                  className="club-select"
                >
                  {clubNames.map((name) => (
                    <option key={`away-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                  <div className="club-venue">{awayClub.stadium}</div>
                </div>
              </div>
              <div className="club-meta">
                <span>Recovery window</span>
                <label className="rest-control">
                  <span className="sr-only">Away club rest days</span>
                  <select
                    value={restAway}
                    onChange={(e) => setRestAway(Number(e.target.value))}
                    aria-label="Away club rest days"
                    className="rest-select"
                  >
                    {[3, 4, 5, 6, 7, 10, 14].map((d) => (
                      <option key={`rest-a-${d}`} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="builder-actions">
            <span className="builder-footnote">Predictions update with your selected recovery windows.</span>
            <button
              type="submit"
              disabled={loading}
              className="simulate-button"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Running match simulation…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run prediction</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-notice" role="alert">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Main Results Showcase */}
      {prediction && (
        <section className="results-section" aria-label="Match prediction">
          <div className="results-heading">
            <div>
              <div className="results-title">The numbers behind the match</div>
              <div className="results-caption">A blended forecast from your selected matchup and recovery settings.</div>
            </div>
            <div className="engine-chip"><Sparkles size={12} /> MODEL CONSENSUS</div>
          </div>

          <div className="results-metrics">
            {/* Expected Goals Duel */}
            <div className="metric-card">
              <div className="metric-label">Expected goals · xG</div>
              <div className="xg-scoreline">
                <div className="xg-team">
                  <span className="xg-team-badge">{homeClub.badgeEmoji}</span>
                  <div>
                    <div className="xg-team-name">{prediction.home_team}</div>
                    <span className="xg-number">{prediction.expected_home_goals.toFixed(2)}</span>
                  </div>
                </div>
                <span className="xg-versus">VS</span>
                <div className="xg-team">
                  <span className="xg-team-badge">{awayClub.badgeEmoji}</span>
                  <div>
                    <div className="xg-team-name">{prediction.away_team}</div>
                    <span className="xg-number">{prediction.expected_away_goals.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="xg-total">
                <span>Expected match total</span>
                <strong>
                  {(prediction.expected_home_goals + prediction.expected_away_goals).toFixed(2)} Goals
                </strong>
              </div>
            </div>

            {/* Strategy A Decision Card */}
            <div className="metric-card verdict-card">
              <div className="verdict-content">
                <div>
                  <div className="metric-label">Model verdict · xG margin</div>
                  <div className="verdict-pill">
                    <Flame className="h-4 w-4" />
                    <span>{prediction.verdict}</span>
                  </div>
                  <div className="verdict-margin">
                    Predicted goal margin <strong>{prediction.margin_pred > 0 ? `+${prediction.margin_pred.toFixed(2)}` : prediction.margin_pred.toFixed(2)} xG</strong>
                  </div>
                </div>
                <div className="xg-total">
                  <span>Decision calibration</span>
                  <strong>Continuous margin</strong>
                </div>
              </div>
            </div>
          </div>

          <ProbabilityBar
            homeTeam={prediction.home_team}
            awayTeam={prediction.away_team}
            homeWinP={prediction.home_win_prob}
            drawP={prediction.draw_prob}
            awayWinP={prediction.away_win_prob}
          />

          <ScorelineGrid scores={prediction.top_scores} />

          <TaleOfTheTape
            homeStats={prediction.tale_of_the_tape.home}
            awayStats={prediction.tale_of_the_tape.away}
          />
        </section>
      )}
    </div>
  );
};
