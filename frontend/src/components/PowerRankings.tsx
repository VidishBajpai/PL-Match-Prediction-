import React, { useState, useEffect } from 'react';
import type { RankingItem } from '../types';
import { getClubInfo } from '../data/clubs';
import { ClubBadge } from './ClubBadge';
import { Trophy, ArrowUpDown, Search, RefreshCw } from 'lucide-react';

export const PowerRankings: React.FC = () => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'elo' | 'xgd' | 'form_pts'>('elo');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rankings');
      if (res.ok) {
        const data = await res.json();
        setRankings(data.rankings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const filtered = rankings
    .filter((r) => r.team.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'elo') return b.elo - a.elo;
      if (sortBy === 'xgd') return b.xgd - a.xgd;
      if (sortBy === 'form_pts') return b.form_pts - a.form_pts;
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff85] via-cyan-400 to-[#38003c]" />

        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#00ff85] uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" />
            <span>Quantitative Hierarchy</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Premier League Dynamic Elo Power Table
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Calibrated with $K=28$ margin-of-victory scaling and 15-match rolling Actual Expected Goal Differentials (xGD).
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search club…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 text-sm text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:border-[#00ff85] focus:ring-1 focus:ring-[#00ff85] outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Sort Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1.5 mr-2">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort By:</span>
        </span>
        <button
          onClick={() => setSortBy('elo')}
          className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${
            sortBy === 'elo'
              ? 'bg-[#00ff85] text-slate-950 shadow-md shadow-[#00ff85]/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          Dynamic Elo Rating
        </button>
        <button
          onClick={() => setSortBy('xgd')}
          className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${
            sortBy === 'xgd'
              ? 'bg-[#00ff85] text-slate-950 shadow-md shadow-[#00ff85]/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          Net xGD / Match
        </button>
        <button
          onClick={() => setSortBy('form_pts')}
          className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${
            sortBy === 'form_pts'
              ? 'bg-[#00ff85] text-slate-950 shadow-md shadow-[#00ff85]/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          Recent Form (5 Matches)
        </button>
      </div>

      {/* Rankings Table Card */}
      <div className="bg-slate-900/85 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/90 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-5 text-center w-12">#</th>
                <th className="py-4 px-5">Club</th>
                <th className="py-4 px-5 text-center">Elo Rating</th>
                <th className="py-4 px-5 text-center">Net xGD / gm</th>
                <th className="py-4 px-5 text-center">xG Created</th>
                <th className="py-4 px-5 text-center">xGA Conceded</th>
                <th className="py-4 px-5 text-center">Form (5 gm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-[#00ff85] mx-auto mb-2" />
                    <span className="font-bold text-sm">Calculating Elo & Rolling Form…</span>
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const club = getClubInfo(item.team);
                  const isTop4 = index < 4;
                  const isRelegation = index >= filtered.length - 3;

                  return (
                    <tr
                      key={item.team}
                      className="hover:bg-slate-800/50 transition-colors font-medium text-slate-200"
                    >
                      {/* Rank number with spot indicators */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                            isTop4
                              ? 'bg-[#00ff85]/15 text-[#00ff85] border border-[#00ff85]/30'
                              : isRelegation
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Club Name + Crest */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <ClubBadge club={club} size="small" showGlow={isTop4} />
                          <div>
                            <span className="font-black text-white text-sm block">
                              {item.team}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {club.stadium}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Elo Rating */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-white">
                          {item.elo.toFixed(1)}
                        </span>
                      </td>

                      {/* Net xGD */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                            item.xgd > 0
                              ? 'bg-[#00ff85]/10 text-[#00ff85]'
                              : item.xgd < 0
                              ? 'bg-red-500/10 text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.xgd > 0 ? `+${item.xgd.toFixed(2)}` : item.xgd.toFixed(2)}
                        </span>
                      </td>

                      {/* xG Created */}
                      <td className="py-3.5 px-5 text-center text-xs text-slate-300 font-semibold">
                        {item.xg_created.toFixed(2)}
                      </td>

                      {/* xGA Conceded */}
                      <td className="py-3.5 px-5 text-center text-xs text-slate-300 font-semibold">
                        {item.xg_conceded.toFixed(2)}
                      </td>

                      {/* Form (5 gm) */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-slate-800/80 text-xs font-black text-slate-200">
                          {item.form_pts} pts
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
