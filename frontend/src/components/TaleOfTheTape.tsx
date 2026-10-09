import React from 'react';
import type { TeamSnapshot } from '../types';
import { getClubInfo } from '../data/clubs';
import { ClubBadge } from './ClubBadge';
import { Swords, CheckCircle2 } from 'lucide-react';

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
      sublabel: 'Dynamic K=28 Elo',
      homeVal: homeStats.elo,
      awayVal: awayStats.elo,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
      min: 1300,
      max: 2050,
    },
    {
      label: 'Baseline Net xGD / Match',
      sublabel: '15-Match Quality Baseline',
      homeVal: homeStats.long_xgd,
      awayVal: awayStats.long_xgd,
      format: (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
      higherIsBetter: true,
      min: -1.5,
      max: 2.0,
    },
    {
      label: 'xG Created / Match',
      sublabel: 'Underlying Chance Creation',
      homeVal: homeStats.long_xg,
      awayVal: awayStats.long_xg,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: true,
      min: 0.5,
      max: 2.8,
    },
    {
      label: 'xGA Conceded / Match',
      sublabel: 'Defensive Solidity (Lower is better)',
      homeVal: homeStats.long_xga,
      awayVal: awayStats.long_xga,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      min: 0.5,
      max: 2.5,
    },
    {
      label: 'Recent Form Points',
      sublabel: 'Last 5 Premier League Matches',
      homeVal: homeStats.short_form_5,
      awayVal: awayStats.short_form_5,
      format: (v: number) => `${v.toFixed(0)} pts`,
      higherIsBetter: true,
      min: 0,
      max: 15,
    },
    {
      label: 'Net Shots on Target / Match',
      sublabel: 'Territorial Shot Dominance',
      homeVal: homeStats.long_net_st,
      awayVal: awayStats.long_net_st,
      format: (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
      higherIsBetter: true,
      min: -4.0,
      max: 5.0,
    },
    {
      label: 'Baseline PPG (15 Matches)',
      sublabel: 'Points per Game Pace',
      homeVal: homeStats.long_ppg,
      awayVal: awayStats.long_ppg,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: true,
      min: 0.5,
      max: 2.8,
    },
  ];

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85]">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Tale of the Tape · Head-to-Head Analytics
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparative statistical metrics across long-term quality and short-term form
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 self-start sm:self-auto">
          15-Game Sample
        </span>
      </div>

      {/* Clubs Banner */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <ClubBadge club={homeClub} size="small" showGlow={true} />
          <div>
            <span className="text-sm font-black text-white block">{homeClub.name}</span>
            <span className="text-[10px] font-bold text-[#00ff85] uppercase">Home Side</span>
          </div>
        </div>

        <div className="text-center px-4 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          VS
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-sm font-black text-white block">{awayClub.name}</span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase">Away Side</span>
          </div>
          <ClubBadge club={awayClub} size="small" showGlow={true} />
        </div>
      </div>

      {/* Comparative Metrics List */}
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
              className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                {/* Home Club Value */}
                <div className="w-24 text-left">
                  <div
                    className={`text-base font-black ${
                      isHomeAdv ? 'text-[#00ff85]' : 'text-slate-300'
                    }`}
                  >
                    {m.format(m.homeVal)}
                  </div>
                  {isHomeAdv && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#00ff85] uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Edge
                    </span>
                  )}
                </div>

                {/* Metric Center Title */}
                <div className="flex-1 text-center">
                  <div className="text-xs font-black text-white tracking-wide">
                    {m.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {m.sublabel}
                  </div>
                </div>

                {/* Away Club Value */}
                <div className="w-24 text-right">
                  <div
                    className={`text-base font-black ${
                      isAwayAdv ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    {m.format(m.awayVal)}
                  </div>
                  {isAwayAdv && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-cyan-400 uppercase">
                      Edge <CheckCircle2 className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Dual Comparative Progress Bar */}
              <div className="grid grid-cols-2 gap-2 h-1.5 w-full">
                {/* Home bar (aligns right to center) */}
                <div className="w-full flex justify-end">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        10,
                        Math.min(
                          100,
                          ((m.homeVal - m.min) / (m.max - m.min)) * 100
                        )
                      )}%`,
                      backgroundColor: homeClub.primaryColor,
                    }}
                  />
                </div>

                {/* Away bar (aligns left to center) */}
                <div className="w-full flex justify-start">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        10,
                        Math.min(
                          100,
                          ((m.awayVal - m.min) / (m.max - m.min)) * 100
                        )
                      )}%`,
                      backgroundColor: awayClub.primaryColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
