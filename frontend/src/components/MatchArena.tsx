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

export const MatchArena: React.FC<MatchArenaProps> = () => {
  const [homeTeam, setHomeTeam] = useState<string>('Liverpool');
  const [awayTeam, setAwayTeam] = useState<string>('Man United');
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
  const clubNames = [...PREMIER_LEAGUE_CLUB_NAMES];

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
            Every fixture has <span className="text-[#d7f36a] drop-shadow-[0_0_18px_rgba(215,243,106,0.22)]">a story.</span>
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
      <section className={`relative overflow-visible rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl ${openPicker ? 'z-[60]' : 'z-0'}`}>
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
        <div className="space-y-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 items-stretch">
            {/* Home Team Card */}
            <div
              ref={homePickerRef}
              className="relative min-w-0 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, rgba(19, 27, 43, 0.98), ${homeClub.primaryColor}20)`,
                borderColor: `${homeClub.primaryColor}44`,
              }}
            >
              <div className="flex items-center justify-between gap-1 mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#00ff85]/10 text-[#00ff85] border border-[#00ff85]/30">
                  HOME SIDE
                </span>
                <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-bold text-slate-400">+50 Elo Home Advantage</span>
                  <button
                    type="button"
                    onClick={() => setOpenPicker(openPicker === 'home' ? null : 'home')}
                    className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
                      openPicker === 'home'
                        ? 'bg-[#00ff85] text-slate-950 border-[#00ff85]'
                        : 'bg-slate-800 hover:bg-slate-700 text-[#00ff85] border-slate-700 hover:border-[#00ff85]/50'
                    }`}
                    aria-expanded={openPicker === 'home'}
                    aria-label={`Choose home club, currently ${homeTeam}`}
                    title="Choose home club"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openPicker === 'home' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Centered team identity; picker stays in the outer corner */}
              <div className="flex min-h-[148px] flex-col items-center justify-center gap-3 text-center">
                <ClubBadge club={homeClub} size="medium" showGlow={true} />
                <div className="min-w-0 max-w-full">
                  <span className="block text-xs sm:text-base font-black text-white truncate">{homeTeam}</span>
                </div>
                <div className="hidden sm:flex items-center justify-center gap-1.5 text-[11px] text-slate-400 max-w-full">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{homeClub.stadium}</span>
                </div>
              </div>

              {/* Home 20 Premier League Teams Dropdown Grid */}
              {openPicker === 'home' && (
                <div className="absolute left-0 top-14 z-50 w-[min(520px,calc(100vw-32px))] p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-[#00ff85]">
                      Choose Home Club ({clubNames.length} Teams)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tap a club to set
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[min(65vh,360px)] overflow-y-auto pr-1">
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
              <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-700/80 flex flex-col items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px] sm:text-xs">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recovery
                </span>
                <div className="flex w-full items-center justify-between gap-0.5 sm:justify-center sm:gap-1">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={`h-rest-${days}`}
                      type="button"
                      onClick={() => {
                        setRestHome(days);
                        fetchPrediction(homeTeam, awayTeam, days, restAway);
                      }}
                      className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all cursor-pointer ${
                        restHome === days
                          ? 'bg-[#00ff85] text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Swap Sides Button */}
            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Home and Away Clubs"
                className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-[#00ff85] border border-slate-700 hover:border-[#00ff85]/50 shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer group"
              >
                <ArrowRightLeft className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-slate-500 uppercase mt-1.5">
                VS
              </span>
            </div>

            {/* Away Team Card */}
            <div
              ref={awayPickerRef}
              className="relative min-w-0 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, rgba(19, 27, 43, 0.98), ${awayClub.primaryColor}20)`,
                borderColor: `${awayClub.primaryColor}44`,
              }}
            >
              <div className="flex items-center justify-between gap-1 mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                  AWAY SIDE
                </span>
                <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-bold text-slate-400">Travelling Side</span>
                  <button
                    type="button"
                    onClick={() => setOpenPicker(openPicker === 'away' ? null : 'away')}
                    className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
                      openPicker === 'away'
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-cyan-400/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-400/50'
                    }`}
                    aria-expanded={openPicker === 'away'}
                    aria-label={`Choose away club, currently ${awayTeam}`}
                    title="Choose away club"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openPicker === 'away' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Centered team identity; picker stays in the outer corner */}
              <div className="flex min-h-[148px] flex-col items-center justify-center gap-3 text-center">
                <ClubBadge club={awayClub} size="medium" showGlow={true} />
                <div className="min-w-0 max-w-full">
                  <span className="block text-xs sm:text-base font-black text-white truncate">{awayTeam}</span>
                </div>
                <div className="hidden sm:flex items-center justify-center gap-1.5 text-[11px] text-slate-400 max-w-full">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{awayClub.stadium}</span>
                </div>
              </div>

              {/* Away 20 Premier League Teams Dropdown Grid */}
              {openPicker === 'away' && (
                <div className="absolute right-0 top-14 z-50 w-[min(520px,calc(100vw-32px))] p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      Choose Away Club ({clubNames.length} Teams)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tap a club to set
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[min(65vh,360px)] overflow-y-auto pr-1">
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
              <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-700/80 flex flex-col items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px] sm:text-xs">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recovery
                </span>
                <div className="flex w-full items-center justify-between gap-0.5 sm:justify-center sm:gap-1">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={`a-rest-${days}`}
                      type="button"
                      onClick={() => {
                        setRestAway(days);
                        fetchPrediction(homeTeam, awayTeam, restHome, days);
                      }}
                      className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all cursor-pointer ${
                        restAway === days
                          ? 'bg-cyan-400 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Predictions refresh automatically when teams or recovery days change.
            </span>
            {loading && (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#00ff85]" role="status">
                <RefreshCw className="w-4 h-4 animate-spin" /> Updating prediction…
              </span>
            )}
          </div>
        </div>

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
          {/* Tri-Hybrid Outcome Probabilities */}
          <ProbabilityBar
            homeTeam={prediction.home_team}
            awayTeam={prediction.away_team}
            homeWinP={prediction.home_win_prob}
            drawP={prediction.draw_prob}
            awayWinP={prediction.away_win_prob}
          />

          {/* Expected Goals Duel, placed below the outcome probabilities */}
          <div className="rounded-3xl bg-slate-900/85 border border-slate-800 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
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

            <div className="grid grid-cols-2 p-3 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex min-h-[148px] flex-col items-center justify-center text-center px-2 sm:px-6 py-3">
                <ClubBadge club={homeClub} size="medium" showGlow={true} className="mb-3" />
                <span className="w-full text-xs sm:text-base font-black text-white leading-tight min-h-5">{prediction.home_team}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Home xG</span>
                <div className="text-2xl sm:text-3xl leading-none font-black text-[#00ff85] tracking-tight mt-1">{prediction.expected_home_goals.toFixed(2)}</div>
              </div>

              <div className="flex min-h-[148px] flex-col items-center justify-center text-center border-l border-slate-700/80 px-2 sm:px-6 py-3">
                <ClubBadge club={awayClub} size="medium" showGlow={true} className="mb-3" />
                <span className="w-full text-xs sm:text-base font-black text-white leading-tight min-h-5">{prediction.away_team}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Away xG</span>
                <div className="text-2xl sm:text-3xl leading-none font-black text-cyan-400 tracking-tight mt-1">{prediction.expected_away_goals.toFixed(2)}</div>
              </div>

              <div className="col-span-2 flex items-center justify-center gap-2 border-t border-slate-800 pt-2 text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Match Total</span>
                <span className="text-base font-black text-white">{(prediction.expected_home_goals + prediction.expected_away_goals).toFixed(2)}</span>
                <span className="text-[9px] font-bold text-slate-400">Expected Goals</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5">
                <span>{homeClub.shortName} Share: {Math.round((prediction.expected_home_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100)}%</span>
                <span>{awayClub.shortName} Share: {Math.round((prediction.expected_away_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                <div style={{ width: `${(prediction.expected_home_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100}%`, backgroundColor: homeClub.primaryColor || '#00ff85' }} className="h-full rounded-l-full transition-all duration-700" />
                <div style={{ width: `${(prediction.expected_away_goals / (prediction.expected_home_goals + prediction.expected_away_goals || 1)) * 100}%`, backgroundColor: awayClub.primaryColor || '#00d2ff' }} className="h-full rounded-r-full transition-all duration-700" />
              </div>
            </div>
          </div>

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
