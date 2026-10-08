import type { TeamSnapshot } from '../types';
import { getClubInfo } from '../data/clubs';
import { ClubBadge } from './ClubBadge';
import { Swords } from 'lucide-react';

interface TaleOfTheTapeProps {
  homeStats: TeamSnapshot;
  awayStats: TeamSnapshot;
}

export const TaleOfTheTape: React.FC<TaleOfTheTapeProps> = ({ homeStats, awayStats }) => {
  const homeClub = getClubInfo(homeStats.name);
  const awayClub = getClubInfo(awayStats.name);

  const metrics = [
    {
      label: 'Club Elo Rating',
      homeVal: homeStats.elo,
      awayVal: awayStats.elo,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
    },
    {
      label: 'Baseline xGD / Game (15 gms)',
      homeVal: homeStats.long_xgd,
      awayVal: awayStats.long_xgd,
      format: (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
      higherIsBetter: true,
    },
    {
      label: 'Baseline xG Created / Game',
      homeVal: homeStats.long_xg,
      awayVal: awayStats.long_xg,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: true,
    },
    {
      label: 'Baseline xGA Conceded / Game',
      homeVal: homeStats.long_xga,
      awayVal: awayStats.long_xga,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false, // Lower is better for conceded goals
    },
    {
      label: 'Recent Momentum Form (5 gms)',
      homeVal: homeStats.short_form_5,
      awayVal: awayStats.short_form_5,
      format: (v: number) => `${v.toFixed(0)} pts`,
      higherIsBetter: true,
    },
    {
      label: 'Net Shots on Target / Game',
      homeVal: homeStats.long_net_st,
      awayVal: awayStats.long_net_st,
      format: (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
      higherIsBetter: true,
    },
    {
      label: 'Baseline PPG (15 gms)',
      homeVal: homeStats.long_ppg,
      awayVal: awayStats.long_ppg,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: true,
    },
  ];

  return (
    <div className="insight-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Swords className="w-4 h-4 text-[#00ff85]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tale of the Tape (Head-to-Head Analytics)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">15-Match Baseline</span>
      </div>

      <div className="flex justify-between items-center px-4 py-2.5 bg-[#120a1f] rounded-xl border border-[#2e1948] mb-3 text-xs font-bold text-white">
        <div className="flex items-center space-x-1.5">
          <ClubBadge club={homeClub} size="small" />
          <span>{homeClub.name}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Metrics</span>
        <div className="flex items-center space-x-1.5">
          <span>{awayClub.name}</span>
          <ClubBadge club={awayClub} size="small" />
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((m) => {
          const isHomeAdv = m.higherIsBetter
            ? m.homeVal > m.awayVal
            : m.homeVal < m.awayVal;
          const isAwayAdv = m.higherIsBetter
            ? m.awayVal > m.homeVal
            : m.awayVal < m.homeVal;

          return (
            <div
              key={m.label}
              className="bg-[#1e1136] p-3 rounded-xl border border-[#352054] flex items-center justify-between"
            >
              {/* Home Value */}
              <div className="w-24 text-left">
                <span
                  className={`text-sm sm:text-base font-extrabold ${
                    isHomeAdv ? 'text-[#00ff85]' : 'text-slate-300'
                  }`}
                >
                  {m.format(m.homeVal)}
                </span>
                {isHomeAdv && (
                  <span className="block text-[10px] font-bold text-[#00ff85] uppercase">
                    Advantage
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 text-center px-2">
                <span className="text-xs font-medium text-slate-400">
                  {m.label}
                </span>
              </div>

              {/* Away Value */}
              <div className="w-24 text-right">
                <span
                  className={`text-sm sm:text-base font-extrabold ${
                    isAwayAdv ? 'text-[#00ff85]' : 'text-slate-300'
                  }`}
                >
                  {m.format(m.awayVal)}
                </span>
                {isAwayAdv && (
                  <span className="block text-[10px] font-bold text-[#00ff85] uppercase">
                    Advantage
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
