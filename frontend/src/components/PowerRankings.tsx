import { useState, useEffect } from 'react';
import type { RankingItem } from '../types';
import { getClubInfo } from '../data/clubs';
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1b0e30] via-[#24133f] to-[#160a29] p-6 rounded-3xl border border-[#3b2061] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#00ff85] uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Quantitative Table Hierarchy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Premier League Dynamic Elo Power Rankings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calibrated with $K=28$ margin-of-victory scaling and 15-game rolling Actual xG baselines.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#120a1f] text-sm text-white pl-9 pr-3 py-2 rounded-xl border border-[#40246a] focus:border-[#00ff85] outline-none"
          />
        </div>
      </div>

      {/* Sort Buttons */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-400 font-semibold flex items-center space-x-1">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort By:</span>
        </span>
        <button
          onClick={() => setSortBy('elo')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            sortBy === 'elo'
              ? 'bg-[#00ff85] text-black shadow-md shadow-[#00ff85]/20'
              : 'bg-[#1e1136] text-slate-300 hover:text-white border border-[#3b2263]'
          }`}
        >
          Elo Rating
        </button>
        <button
          onClick={() => setSortBy('xgd')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            sortBy === 'xgd'
              ? 'bg-[#00ff85] text-black shadow-md shadow-[#00ff85]/20'
              : 'bg-[#1e1136] text-slate-300 hover:text-white border border-[#3b2263]'
          }`}
        >
          Net xGD / gm
        </button>
        <button
          onClick={() => setSortBy('form_pts')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            sortBy === 'form_pts'
              ? 'bg-[#00ff85] text-black shadow-md shadow-[#00ff85]/20'
              : 'bg-[#1e1136] text-slate-300 hover:text-white border border-[#3b2263]'
          }`}
        >
          Recent Form (5 gms)
        </button>
      </div>

      {/* Rankings Table Card */}
      <div className="bg-[#180e29] rounded-2xl border border-[#2f1d4b] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#130922] text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-[#2d1b4a]">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Club</th>
                <th className="py-3.5 px-4 text-center">Elo Rating</th>
                <th className="py-3.5 px-4 text-center">Net xGD / gm</th>
                <th className="py-3.5 px-4 text-center">xG Created</th>
                <th className="py-3.5 px-4 text-center">xGA Conceded</th>
                <th className="py-3.5 px-4 text-center">Form (5 gms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#271540]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#00ff85] mx-auto mb-2" />
                    <span>Loading Power Rankings...</span>
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const club = getClubInfo(item.team);
                  return (
                    <tr
                      key={item.team}
                      className="hover:bg-[#201338] transition-colors font-medium text-slate-200"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">{club.badgeEmoji}</span>
                          <span className="font-extrabold text-white text-sm">{item.team}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-white bg-[#10081d] px-2.5 py-1 rounded-md border border-[#361e59]">
                          {item.elo.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-extrabold text-xs ${
                            item.xgd > 0
                              ? 'text-[#00ff85]'
                              : item.xgd < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.xgd > 0 ? `+${item.xgd.toFixed(2)}` : item.xgd.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-300">
                        {item.xg_created.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-300">
                        {item.xg_conceded.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-[#291444] text-[#00ff85] text-xs font-bold px-2 py-0.5 rounded border border-[#00ff85]/20">
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
