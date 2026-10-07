import React from 'react';
import { getClubInfo } from '../data/clubs';

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
  const awayPct = Math.round(awayWinP * 100);

  return (
    <div className="insight-card">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Tri-Hybrid Outcome Distribution
        </span>
        <span className="text-[11px] font-semibold text-[#00ff85] bg-[#00ff85]/10 px-2 py-0.5 rounded border border-[#00ff85]/20">
          Dixon-Coles + XGBoost + Margin
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="h-6 w-full rounded-xl overflow-hidden flex bg-[#10091d] p-0.5 border border-[#3b2361]">
        {/* Home Win */}
        <div
          style={{
            width: `${homePct}%`,
            backgroundColor: homeClub.primaryColor || '#EF0107',
          }}
          className="h-full rounded-l-lg transition-all duration-700 ease-out flex items-center justify-center relative group"
        >
          {homePct >= 15 && (
            <span className="text-[11px] font-black text-white drop-shadow-md">
              {homePct}%
            </span>
          )}
        </div>

        {/* Draw */}
        <div
          style={{ width: `${drawPct}%` }}
          className="h-full bg-slate-600 transition-all duration-700 ease-out flex items-center justify-center relative group"
        >
          {drawPct >= 15 && (
            <span className="text-[11px] font-black text-white drop-shadow-md">
              {drawPct}%
            </span>
          )}
        </div>

        {/* Away Win */}
        <div
          style={{
            width: `${awayPct}%`,
            backgroundColor: awayClub.primaryColor || '#034694',
          }}
          className="h-full rounded-r-lg transition-all duration-700 ease-out flex items-center justify-center relative group"
        >
          {awayPct >= 15 && (
            <span className="text-[11px] font-black text-white drop-shadow-md">
              {awayPct}%
            </span>
          )}
        </div>
      </div>

      {/* Metric Labels */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-[#1f1236] p-2.5 rounded-xl border border-[#352054]">
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: homeClub.primaryColor }}
            />
            <span className="text-xs font-bold text-slate-300 truncate">{homeClub.name} Win</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">{homePct}%</div>
        </div>

        <div className="bg-[#1f1236] p-2.5 rounded-xl border border-[#352054]">
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-500" />
            <span className="text-xs font-bold text-slate-300">Draw</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">{drawPct}%</div>
        </div>

        <div className="bg-[#1f1236] p-2.5 rounded-xl border border-[#352054]">
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: awayClub.primaryColor }}
            />
            <span className="text-xs font-bold text-slate-300 truncate">{awayClub.name} Win</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">{awayPct}%</div>
        </div>
      </div>
    </div>
  );
};
