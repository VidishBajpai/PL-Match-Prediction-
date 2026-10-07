import React from 'react';
import type { ScoreProbability } from '../types';
import { Target } from 'lucide-react';

interface ScorelineGridProps {
  scores: ScoreProbability[];
}

export const ScorelineGrid: React.FC<ScorelineGridProps> = ({ scores }) => {
  return (
    <div className="insight-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-[#00ff85]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Most Probable Scorelines (Bivariate Poisson)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">Top 5 Outcomes</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {scores.map((s, idx) => {
          const isTop = idx === 0;
          return (
            <div
              key={s.score}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isTop
                  ? 'bg-gradient-to-b from-[#38003c] to-[#1c0f33] border-[#00ff85] shadow-lg shadow-[#00ff85]/10 scale-[1.02]'
                  : 'bg-[#1e1136] border-[#372159] hover:border-[#523285]'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                    isTop ? 'bg-[#00ff85] text-black' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  #{idx + 1}
                </span>
                <span className="text-lg font-black text-white tracking-wide">
                  {s.score}
                </span>
              </div>
              <span className={`text-xs font-bold ${isTop ? 'text-[#00ff85]' : 'text-slate-400'}`}>
                {s.prob}% prob
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
