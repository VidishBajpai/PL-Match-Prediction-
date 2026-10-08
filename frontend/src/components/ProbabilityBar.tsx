import React from 'react';
import { getClubInfo } from '../data/clubs';
import { ClubBadge } from './ClubBadge';
import { PieChart, ShieldCheck } from 'lucide-react';

interface ProbabilityBarProps {
  homeTeam: string;
  awayTeam: string;
  homeWinP: number;
  drawP: number;
  awayWinP: number;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  homeTeam,
  awayTeam,
  homeWinP,
  drawP,
  awayWinP,
}) => {
  const homeClub = getClubInfo(homeTeam);
  const awayClub = getClubInfo(awayTeam);

  const homePct = Math.round(homeWinP * 100);
  const drawPct = Math.round(drawP * 100);
  const rawAwayPct = Math.round(awayWinP * 100);
  const awayPct = homePct + drawPct + rawAwayPct === 100 ? rawAwayPct : Math.max(0, 100 - homePct - drawPct);

  const highestProb = Math.max(homePct, drawPct, awayPct);

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Tri-Hybrid Outcome Probability Distribution
            </h3>
            <p className="text-[11px] text-slate-400">
              Blended Dixon–Coles (40%) + XGBoost (30%) + Margin Regressor (30%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#00ff85]/10 border border-[#00ff85]/25 text-[10px] font-black text-[#00ff85] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Isotonically Calibrated</span>
        </div>
      </div>

      {/* Multi-Segment Probability Bar */}
      <div className="h-8 w-full rounded-2xl overflow-hidden flex bg-slate-950 p-1 border border-slate-800 shadow-inner">
        {/* Home Win Segment */}
        <div
          style={{
            width: `${homePct}%`,
            backgroundColor: homeClub.primaryColor || '#EF0107',
          }}
          className="h-full rounded-l-xl transition-all duration-700 ease-out flex items-center justify-center relative group min-w-[28px]"
        >
          {homePct >= 12 && (
            <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {homePct}%
            </span>
          )}
        </div>

        {/* Draw Segment */}
        <div
          style={{ width: `${drawPct}%` }}
          className="h-full bg-slate-700/80 transition-all duration-700 ease-out flex items-center justify-center relative group min-w-[28px]"
        >
          {drawPct >= 12 && (
            <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {drawPct}%
            </span>
          )}
        </div>

        {/* Away Win Segment */}
        <div
          style={{
            width: `${awayPct}%`,
            backgroundColor: awayClub.primaryColor || '#034694',
          }}
          className="h-full rounded-r-xl transition-all duration-700 ease-out flex items-center justify-center relative group min-w-[28px]"
        >
          {awayPct >= 12 && (
            <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {awayPct}%
            </span>
          )}
        </div>
      </div>

      {/* Three Detailed Probability Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        {/* Home Win Card */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
            highestProb === homePct
              ? 'bg-slate-800/90 border-[#00ff85]/60 shadow-lg shadow-[#00ff85]/10 ring-1 ring-[#00ff85]/30'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <ClubBadge club={homeClub} size="small" showGlow={highestProb === homePct} />
            <div className="min-w-0">
              <span className="text-xs font-black text-white block truncate">
                {homeClub.name} Win
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Home Advantage
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-white tracking-tight">
              {homePct}%
            </div>
            {highestProb === homePct && (
              <span className="text-[9px] font-extrabold text-[#00ff85] uppercase tracking-wider block">
                Favorite
              </span>
            )}
          </div>
        </div>

        {/* Draw Card */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
            highestProb === drawPct
              ? 'bg-slate-800/90 border-[#00ff85]/60 shadow-lg shadow-[#00ff85]/10 ring-1 ring-[#00ff85]/30'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-black text-xs">
              =
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                Match Draw
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Even Scoreline
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-white tracking-tight">
              {drawPct}%
            </div>
            {highestProb === drawPct && (
              <span className="text-[9px] font-extrabold text-[#00ff85] uppercase tracking-wider block">
                Favorite
              </span>
            )}
          </div>
        </div>

        {/* Away Win Card */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
            highestProb === awayPct
              ? 'bg-slate-800/90 border-[#00ff85]/60 shadow-lg shadow-[#00ff85]/10 ring-1 ring-[#00ff85]/30'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <ClubBadge club={awayClub} size="small" showGlow={highestProb === awayPct} />
            <div className="min-w-0">
              <span className="text-xs font-black text-white block truncate">
                {awayClub.name} Win
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Away Fixture
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-white tracking-tight">
              {awayPct}%
            </div>
            {highestProb === awayPct && (
              <span className="text-[9px] font-extrabold text-[#00ff85] uppercase tracking-wider block">
                Favorite
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
