import React, { useState, useEffect, useRef } from 'react';
import type { PredictionResponse, TeamSnapshot } from '../types';
import { getClubInfo, PREMIER_LEAGUE_CLUB_NAMES } from '../data/clubs';
import { ProbabilityBar } from './ProbabilityBar';
import { ScorelineGrid } from './ScorelineGrid';
import { TaleOfTheTape } from './TaleOfTheTape';
import { ClubBadge } from './ClubBadge';
import {
  ArrowRightLeft,
  ChevronDown,
  Sparkles,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  Gauge,
  Check,
} from 'lucide-react';

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

  // Toggle state to open the 20-team list next to Home or Away card
  const [openPicker, setOpenPicker] = useState<'home' | 'away' | null>(null);

  const homePickerRef = useRef<HTMLDivElement>(null);
  const awayPickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        openPicker === 'home' &&
        homePickerRef.current &&
        !homePickerRef.current.contains(target)
      ) {
        setOpenPicker(null);
      }
      if (
        openPicker === 'away' &&
        awayPickerRef.current &&
        !awayPickerRef.current.contains(target)
      ) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPicker]);

  // Strict list of the 20 clubs in the current Premier League season
  const availableTeams = new Set(teams.map((team) => team.name));
  const clubNames = PREMIER_LEAGUE_CLUB_NAMES.filter(
    (name) => teams.length === 0 || availableTeams.has(name) || true,
  );

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
      setError('Failed to fetch prediction from server. Ensure the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(homeTeam, awayTeam, restHome, restAway);
  }, []);

  const handleSwap = () => {
    const tempH = homeTeam;
    const tempA = awayTeam;
    const tempRH = restHome;
    const tempRA = restAway;
    setHomeTeam(tempA);
    setAwayTeam(tempH);
    setRestHome(tempRA);
    setRestAway(tempRH);
    fetchPrediction(tempA, tempH, tempRA, tempRH);
  };

  const selectClubForSide = (side: 'home' | 'away', name: string) => {
    if (side === 'home') {
      if (name === awayTeam) {
        // Swap if picking opponent
        setAwayTeam(homeTeam);
        setHomeTeam(name);
        fetchPrediction(name, homeTeam, restHome, restAway);
      } else {
        setHomeTeam(name);
        fetchPrediction(name, awayTeam, restHome, restAway);
      }
    } else {
      if (name === homeTeam) {
        // Swap if picking opponent
        setHomeTeam(awayTeam);
        setAwayTeam(name);
        fetchPrediction(awayTeam, name, restHome, restAway);
      } else {
        setAwayTeam(name);
        fetchPrediction(homeTeam, name, restHome, restAway);
      }
    }
    setOpenPicker(null);
  };

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrediction(homeTeam, awayTeam, restHome, restAway);
  };

  const homeClub = getClubInfo(homeTeam);
  const awayClub = getClubInfo(awayTeam);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Headline */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85] text-xs font-black uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-ping" />
            <span>2026/27 Premier League Campaign</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Every fixture has <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff85] via-[#00f5d4] to-cyan-400">a story.</span>
          </h1>
          <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            Put any two of the 20 current Premier League sides head to head. Toggle teams, test recovery windows, and simulate underlying match dynamics.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 shrink-0 text-right">
          <div>
            <span className="text-xs font-black text-white block">Tri-Hybrid Ensemble</span>
            <span className="text-[10px] text-[#00ff85] font-semibold">20 Official Premier League Clubs</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 text-[#00ff85]">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Matchup Builder Card */}
      <section className="relative overflow-visible rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff85] via-cyan-400 to-[#38003c]" />

        {/* Builder Top Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Matchup & Recovery Setup
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click the toggle button next to either club to select from all 20 Premier League sides.
            </p>
          </div>
        </div>

        {/* Duel Faceoff Form */}
        <form onSubmit={handlePredictSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Home Team Card */}
            <div
              ref={homePickerRef}
              className="relative p-6 rounded-3xl border transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, rgba(15, 23, 42, 0.95), ${homeClub.primaryColor}18)`,
                borderColor: `${homeClub.primaryColor}55`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00ff85]/15 text-[#00ff85] border border-[#00ff85]/30">
                  HOME SIDE
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  +65 Elo Home Advantage
                </span>
              </div>

              {/* Team Identity + Toggle Button Right Next To Card */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <ClubBadge club={homeClub} size="large" showGlow={true} />
                  <div className="min-w-0">
                    <span className="text-xl sm:text-2xl font-black text-white block truncate">
                      {homeTeam}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{homeClub.stadium}</span>
                    </div>
                  </div>
                </div>

                {/* Toggle Button Right Next To Team Card */}
                <button
                  type="button"
                  onClick={() => setOpenPicker(openPicker === 'home' ? null : 'home')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border shadow-lg ${
                    openPicker === 'home'
                      ? 'bg-[#00ff85] text-slate-950 border-[#00ff85] shadow-[#00ff85]/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-[#00ff85] border-slate-700 hover:border-[#00ff85]/50'
                  }`}
                  aria-expanded={openPicker === 'home'}
                >
                  <span>Select Club</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openPicker === 'home' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Home 20 Premier League Teams Dropdown Grid */}
              {openPicker === 'home' && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 p-4 rounded-3xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-[#00ff85]">
                      Choose Home Club ({clubNames.length} Teams)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tap a club to set
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                    {clubNames.map((name) => {
                      const club = getClubInfo(name);
                      const isSelected = homeTeam === name;
                      const isOpponent = awayTeam === name;

                      return (
                        <button
                          key={`home-pick-${name}`}
                          type="button"
                          onClick={() => selectClubForSide('home', name)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#00ff85]/15 border-[#00ff85] text-white shadow-md'
                              : isOpponent
                              ? 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                              : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <ClubBadge club={club} size="small" showGlow={isSelected} />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black block truncate">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {club.shortName} {isOpponent ? '(Away)' : ''}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#00ff85] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Home Rest Days Pill Control */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Recovery Window:
                </span>
                <div className="flex items-center gap-1">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={`h-rest-${days}`}
                      type="button"
                      onClick={() => setRestHome(days)}
                      className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        restHome === days
                          ? 'bg-[#00ff85] text-slate-950 shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Swap Sides Button */}
            <div className="flex flex-col items-center justify-center py-2 lg:py-0">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Home and Away Clubs"
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[#00ff85] border border-slate-700 hover:border-[#00ff85]/50 shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer group"
              >
                <ArrowRightLeft className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase mt-2">
                VS
              </span>
            </div>

            {/* Away Team Card */}
            <div
              ref={awayPickerRef}
              className="relative p-6 rounded-3xl border transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, rgba(15, 23, 42, 0.95), ${awayClub.primaryColor}18)`,
                borderColor: `${awayClub.primaryColor}55`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400/15 text-cyan-400 border border-cyan-400/30">
                  AWAY SIDE
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Travelling Side
                </span>
              </div>

              {/* Team Identity + Toggle Button Right Next To Card */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <ClubBadge club={awayClub} size="large" showGlow={true} />
                  <div className="min-w-0">
                    <span className="text-xl sm:text-2xl font-black text-white block truncate">
                      {awayTeam}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{awayClub.stadium}</span>
                    </div>
                  </div>
                </div>

                {/* Toggle Button Right Next To Team Card */}
                <button
                  type="button"
                  onClick={() => setOpenPicker(openPicker === 'away' ? null : 'away')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border shadow-lg ${
                    openPicker === 'away'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-cyan-400/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700 hover:border-cyan-400/50'
                  }`}
                  aria-expanded={openPicker === 'away'}
                >
                  <span>Select Club</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openPicker === 'away' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Away 20 Premier League Teams Dropdown Grid */}
              {openPicker === 'away' && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 p-4 rounded-3xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      Choose Away Club ({clubNames.length} Teams)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tap a club to set
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                    {clubNames.map((name) => {
                      const club = getClubInfo(name);
                      const isSelected = awayTeam === name;
                      const isOpponent = homeTeam === name;

                      return (
                        <button
                          key={`away-pick-${name}`}
                          type="button"
                          onClick={() => selectClubForSide('away', name)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-400/15 border-cyan-400 text-white shadow-md'
                              : isOpponent
                              ? 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                              : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <ClubBadge club={club} size="small" showGlow={isSelected} />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black block truncate">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {club.shortName} {isOpponent ? '(Home)' : ''}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Away Rest Days Pill Control */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Recovery Window:
                </span>
                <div className="flex items-center gap-1">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={`a-rest-${days}`}
                      type="button"
                      onClick={() => setRestAway(days)}
                      className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        restAway === days
                          ? 'bg-cyan-400 text-slate-950 shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Run Prediction Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">
              Only authentic 2026/27 Premier League teams. Dynamic Elo ratings and actual xG.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00ff85] to-[#00d2ff] hover:opacity-90 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-[#00ff85]/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Simulation…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Match Simulation</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Main Results Showcase */}
      {prediction && (
        <section className="space-y-6 animate-in fade-in duration-500" aria-label="Match Prediction Results">
          {/* Expected Goals Duel Centerpiece */}
          <div className="rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Expected Goals (xG) Forecast Duel
                </h3>
                <p className="text-xs text-slate-400">
                  Consensus goal expectancy rates derived from Dixon–Coles and Shot Quality models
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[10px] font-black uppercase tracking-wider text-[#00ff85] border border-slate-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Consensus Engine</span>
              </div>
            </div>

            {/* Scoreboard Graphic */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              {/* Home Team xG */}
              <div className="flex items-center gap-4">
                <ClubBadge club={homeClub} size="large" showGlow={true} />
                <div>
                  <span className="text-base sm:text-lg font-black text-white block">
                    {prediction.home_team}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">
                    Expected Goals (λH)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#00ff85] tracking-tight">
                    {prediction.expected_home_goals.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Total Match xG Center Meter */}
              <div className="flex flex-col items-center justify-center text-center px-6 py-2 border-y md:border-y-0 md:border-x border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  MATCH TOTAL
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {(prediction.expected_home_goals + prediction.expected_away_goals).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Expected Total Goals
                </span>
              </div>

              {/* Away Team xG */}
              <div className="flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
                <div className="order-2 md:order-1">
                  <span className="text-base sm:text-lg font-black text-white block">
                    {prediction.away_team}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">
                    Expected Goals (λA)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
                    {prediction.expected_away_goals.toFixed(2)}
                  </div>
                </div>
                <ClubBadge club={awayClub} size="large" showGlow={true} className="order-1 md:order-2" />
              </div>
            </div>

            {/* Visual Goal Share Ratio Bar */}
            <div className="mt-5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1.5">
                <span>{homeClub.shortName} Share: {Math.round((prediction.expected_home_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100)}%</span>
                <span>{awayClub.shortName} Share: {Math.round((prediction.expected_away_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                <div
                  style={{
                    width: `${(prediction.expected_home_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100}%`,
                    backgroundColor: homeClub.primaryColor || '#00ff85',
                  }}
                  className="h-full rounded-l-full transition-all duration-700"
                />
                <div
                  style={{
                    width: `${(prediction.expected_away_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100}%`,
                    backgroundColor: awayClub.primaryColor || '#00d2ff',
                  }}
                  className="h-full rounded-r-full transition-all duration-700"
                />
              </div>
            </div>
          </div>

          {/* Tri-Hybrid Outcome Probabilities */}
          <ProbabilityBar
            homeTeam={prediction.home_team}
            awayTeam={prediction.away_team}
            homeWinP={prediction.home_win_prob}
            drawP={prediction.draw_prob}
            awayWinP={prediction.away_win_prob}
          />

          {/* Top Exact Scorelines (Poisson) */}
          <ScorelineGrid scores={prediction.top_scores} />

          {/* Tale of the Tape Analytics */}
          <TaleOfTheTape
            homeStats={prediction.tale_of_the_tape.home}
            awayStats={prediction.tale_of_the_tape.away}
          />
        </section>
      )}
    </div>
  );
};
