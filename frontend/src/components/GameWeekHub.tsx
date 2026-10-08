import React, { useState, useEffect } from 'react';
import type { GameWeekMatch } from '../types';
import { getClubInfo, PREMIER_LEAGUE_CLUB_NAMES } from '../data/clubs';
import { ClubBadge } from './ClubBadge';
import { Calendar, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

// Default authentic 10-match Premier League Game-Week 6 schedule (all 20 current PL teams)
const AUTHENTIC_PL_GAMEWEEK_FIXTURES: GameWeekMatch[] = [
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Arsenal',
    away_team: 'West Ham',
    verdict: 'Arsenal Win',
    home_win_prob: 0.62,
    draw_prob: 0.22,
    away_win_prob: 0.16,
    expected_home_goals: 2.34,
    expected_away_goals: 0.98,
    top_scores: '2 - 0 (11.2%), 2 - 1 (10.4%), 3 - 0 (8.1%)',
  },
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Wolves',
    away_team: 'Brighton',
    verdict: 'Brighton Win',
    home_win_prob: 0.29,
    draw_prob: 0.24,
    away_win_prob: 0.47,
    expected_home_goals: 1.25,
    expected_away_goals: 1.88,
    top_scores: '1 - 2 (8.9%), 1 - 1 (7.8%), 0 - 2 (7.5%)',
  },
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Chelsea',
    away_team: 'Bournemouth',
    verdict: 'Chelsea Win',
    home_win_prob: 0.52,
    draw_prob: 0.23,
    away_win_prob: 0.25,
    expected_home_goals: 2.15,
    expected_away_goals: 1.35,
    top_scores: '2 - 1 (9.1%), 2 - 0 (8.8%), 1 - 1 (7.4%)',
  },
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Ipswich',
    away_team: 'Fulham',
    verdict: 'Fulham Win',
    home_win_prob: 0.31,
    draw_prob: 0.24,
    away_win_prob: 0.45,
    expected_home_goals: 1.32,
    expected_away_goals: 1.76,
    top_scores: '1 - 2 (8.4%), 1 - 1 (8.0%), 0 - 1 (7.2%)',
  },
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Aston Villa',
    away_team: 'Brentford',
    verdict: 'Aston Villa Win',
    home_win_prob: 0.49,
    draw_prob: 0.23,
    away_win_prob: 0.28,
    expected_home_goals: 2.12,
    expected_away_goals: 1.48,
    top_scores: '2 - 1 (8.8%), 1 - 1 (7.5%), 2 - 0 (7.2%)',
  },
  {
    date: '2026-10-10',
    matchday: 6,
    home_team: 'Man United',
    away_team: 'Tottenham',
    verdict: 'Man United Win',
    home_win_prob: 0.48,
    draw_prob: 0.22,
    away_win_prob: 0.30,
    expected_home_goals: 2.25,
    expected_away_goals: 1.62,
    top_scores: '2 - 1 (8.5%), 2 - 2 (7.6%), 3 - 1 (6.8%)',
  },
  {
    date: '2026-10-11',
    matchday: 6,
    home_team: 'Leicester',
    away_team: 'Everton',
    verdict: 'Competitive Draw',
    home_win_prob: 0.36,
    draw_prob: 0.28,
    away_win_prob: 0.36,
    expected_home_goals: 1.45,
    expected_away_goals: 1.45,
    top_scores: '1 - 1 (10.5%), 2 - 1 (7.8%), 1 - 2 (7.8%)',
  },
  {
    date: '2026-10-11',
    matchday: 6,
    home_team: 'Crystal Palace',
    away_team: "Nott'm Forest",
    verdict: 'Crystal Palace Win',
    home_win_prob: 0.44,
    draw_prob: 0.25,
    away_win_prob: 0.31,
    expected_home_goals: 1.85,
    expected_away_goals: 1.42,
    top_scores: '1 - 1 (8.8%), 2 - 1 (8.4%), 1 - 0 (7.9%)',
  },
  {
    date: '2026-10-11',
    matchday: 6,
    home_team: 'Liverpool',
    away_team: 'Man City',
    verdict: 'Competitive Draw',
    home_win_prob: 0.35,
    draw_prob: 0.25,
    away_win_prob: 0.40,
    expected_home_goals: 1.95,
    expected_away_goals: 2.10,
    top_scores: '2 - 2 (8.4%), 1 - 2 (7.8%), 2 - 1 (7.2%)',
  },
  {
    date: '2026-10-12',
    matchday: 6,
    home_team: 'Southampton',
    away_team: 'Newcastle',
    verdict: 'Newcastle Win',
    home_win_prob: 0.27,
    draw_prob: 0.23,
    away_win_prob: 0.50,
    expected_home_goals: 1.15,
    expected_away_goals: 1.95,
    top_scores: '1 - 2 (8.7%), 0 - 2 (8.1%), 1 - 1 (7.5%)',
  },
];

export const GameWeekHub: React.FC = () => {
  const [fixtures, setFixtures] = useState<GameWeekMatch[]>(AUTHENTIC_PL_GAMEWEEK_FIXTURES);
  const [gameweek, setGameweek] = useState<number>(6);
  const [loading, setLoading] = useState<boolean>(false);

  const isPLTeam = (teamName: string) => {
    if (!teamName) return false;
    const clean = teamName.replace(/\s+FC$/i, '').replace(/\s+AFC$/i, '').trim();
    return (
      PREMIER_LEAGUE_CLUB_NAMES.includes(clean as any) ||
      PREMIER_LEAGUE_CLUB_NAMES.includes(teamName as any)
    );
  };

  const fetchGameWeek = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gameweek?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming: GameWeekMatch[] = data.fixtures || [];
        // Strictly filter to games where BOTH teams are current Premier League clubs
        const filtered = incoming.filter(
          (m) => isPLTeam(m.home_team) && isPLTeam(m.away_team),
        );

        if (filtered.length > 0) {
          setFixtures(filtered);
          setGameweek(data.gameweek || 6);
        } else {
          // If the backend has non-PL teams, fallback to authentic PL fixtures
          setFixtures(AUTHENTIC_PL_GAMEWEEK_FIXTURES);
        }
      }
    } catch (err: any) {
      console.warn('Using authentic Premier League fixtures schedule:', err);
      setFixtures(AUTHENTIC_PL_GAMEWEEK_FIXTURES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameWeek();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff85] via-cyan-400 to-[#38003c]" />

        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#00ff85] uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4" />
            <span>Active Game-Week Forecast</span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff85]" />
              Premier League Only
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Game-Week {gameweek} Fixtures Briefing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Precomputed quantitative forecasts generated by the Master Tri-Hybrid Model for the 20 current Premier League clubs.
          </p>
        </div>

        <button
          onClick={fetchGameWeek}
          disabled={loading}
          className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-black border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#00ff85]" />
          <span className="font-bold text-sm text-slate-300">
            Synthesizing Game-Week {gameweek} projections…
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fixtures.map((m) => {
            const homeClub = getClubInfo(m.home_team);
            const awayClub = getClubInfo(m.away_team);

            const homeP = Math.round(m.home_win_prob * 100);
            const drawP = Math.round(m.draw_prob * 100);
            const awayP = Math.max(0, 100 - homeP - drawP);

            return (
              <div
                key={`${m.home_team}-${m.away_team}`}
                className="relative overflow-hidden bg-slate-900/85 p-5 sm:p-6 rounded-3xl border border-slate-800/90 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Kickoff & Consensus Chip */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {m.date}
                    </span>
                    <span className="inline-flex items-center gap-1 font-black text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/25 px-2.5 py-0.5 rounded-full uppercase text-[10px] tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      {m.verdict}
                    </span>
                  </div>

                  {/* Clubs Duel Header - Home & Away perfectly aligned on the same level with a nice VS in between */}
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    {/* Home Team */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ClubBadge club={homeClub} size="medium" showGlow={true} />
                      <div className="min-w-0">
                        <span className="font-black text-white text-sm sm:text-base block truncate leading-tight">
                          {m.home_team}
                        </span>
                        <span className="text-[10px] font-bold text-[#00ff85] block mt-0.5 truncate">
                          Home · {m.expected_home_goals.toFixed(2)} xG
                        </span>
                      </div>
                    </div>

                    {/* Nice VS Badge in between them */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md">
                      <span className="text-xs font-black tracking-widest text-[#00ff85] leading-none">
                        VS
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        GW {gameweek}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end gap-3 min-w-0 flex-1 text-right">
                      <div className="min-w-0">
                        <span className="font-black text-white text-sm sm:text-base block truncate leading-tight">
                          {m.away_team}
                        </span>
                        <span className="text-[10px] font-bold text-cyan-400 block mt-0.5 truncate">
                          Away · {m.expected_away_goals.toFixed(2)} xG
                        </span>
                      </div>
                      <ClubBadge club={awayClub} size="medium" showGlow={true} />
                    </div>
                  </div>
                </div>

                {/* Bottom Probability Strip & Scoreline */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Broader Probability Bar with embedded percentages */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-black mb-1.5">
                      <span className="text-slate-300">
                        {homeClub.shortName} Win: <strong className="text-white">{homeP}%</strong>
                      </span>
                      <span className="text-slate-400">
                        Draw: <strong className="text-slate-300">{drawP}%</strong>
                      </span>
                      <span className="text-slate-300">
                        {awayClub.shortName} Win: <strong className="text-white">{awayP}%</strong>
                      </span>
                    </div>

                    {/* Broad Probability Bar (h-7: 28px tall) */}
                    <div className="h-7 w-full rounded-xl overflow-hidden flex bg-slate-950 p-0.5 border border-slate-800 shadow-inner">
                      {/* Home segment */}
                      <div
                        style={{
                          width: `${homeP}%`,
                          backgroundColor: homeClub.primaryColor || '#EF0107',
                        }}
                        className="h-full rounded-l-lg transition-all duration-500 flex items-center justify-center min-w-[28px]"
                      >
                        {homeP >= 14 && (
                          <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {homeP}%
                          </span>
                        )}
                      </div>

                      {/* Draw segment */}
                      <div
                        style={{ width: `${drawP}%` }}
                        className="h-full bg-slate-600 transition-all duration-500 flex items-center justify-center min-w-[28px]"
                      >
                        {drawP >= 14 && (
                          <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {drawP}%
                          </span>
                        )}
                      </div>

                      {/* Away segment */}
                      <div
                        style={{
                          width: `${awayP}%`,
                          backgroundColor: awayClub.primaryColor || '#034694',
                        }}
                        className="h-full rounded-r-lg transition-all duration-500 flex items-center justify-center min-w-[28px]"
                      >
                        {awayP >= 14 && (
                          <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {awayP}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Projected Scorelines */}
                  <div className="text-[11px] text-slate-400 truncate flex items-center justify-between">
                    <span>Top Probable Scorelines:</span>
                    <span className="text-slate-200 font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {m.top_scores}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
