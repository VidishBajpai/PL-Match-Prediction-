import React from 'react';
import type { ScoreProbability } from '../types';
import { Target } from 'lucide-react';

interface ScorelineGridProps {
  scores: ScoreProbability[];
}

export const ScorelineGrid: React.FC<ScorelineGridProps> = ({ scores }) => {
  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Most Probable Exact Scorelines
            </h3>
            <p className="text-[11px] text-slate-400">
              Computed via 2D Bivariate Poisson Distribution from Expected Goals
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 self-start sm:self-auto">
          Top 5 Projections
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {scores.map((s, idx) => {
          return (
            <div
              key={s.score}
              className="relative overflow-hidden p-4 rounded-2xl border bg-slate-950/60 border-slate-800/80 transition-all duration-300 flex flex-col items-center justify-center hover:border-slate-700 hover:scale-[1.01]"
            >
              {/* Position badge */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-bold">
                  #{idx + 1}
                </span>
              </div>

              {/* Exact Score */}
              <div className="text-2xl font-black text-white tracking-wide my-1">
                {s.score}
              </div>

              {/* Probability */}
              <div className="text-xs font-black mt-1 text-slate-400">
                {s.prob}% chance
              </div>

              {/* Mini probability gauge bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-600"
                  style={{ width: `${Math.min(100, s.prob * 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
