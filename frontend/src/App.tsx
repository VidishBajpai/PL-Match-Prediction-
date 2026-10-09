import { useState, useEffect } from 'react';
import type { TeamSnapshot } from './types';
import { Navbar } from './components/Navbar';
import { MatchArena } from './components/MatchArena';
import { GameWeekHub } from './components/GameWeekHub';
import { PowerRankings } from './components/PowerRankings';
import { BrandLogo } from './components/BrandLogo';
import { RefreshCw } from 'lucide-react';
import './App.css';

export const App = () => {
  const [activeTab, setActiveTab] = useState<'arena' | 'gameweek' | 'rankings'>('arena');
  const [teams, setTeams] = useState<TeamSnapshot[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
        }
      } catch (err) {
        console.error('Failed to load teams from API:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="app-shell min-h-screen text-slate-100 flex flex-col selection:bg-[#00ff85] selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-main flex-1">
        {initialLoading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-slate-400">
            <BrandLogo size="lg" showText={false} />
            <div className="flex items-center gap-2.5 text-sm font-black text-[#00ff85]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Warming up the quantitative prediction engine…</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              Loading 15-game actual xG metrics and dynamic Elo ratings for all 20 Premier League clubs.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'arena' && <MatchArena teams={teams} />}
            {activeTab === 'gameweek' && <GameWeekHub />}
            {activeTab === 'rankings' && <PowerRankings />}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-800/80 bg-[#060911]/90 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl space-y-3 px-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2 h-2 rounded-full bg-[#00ff85]" />
              Ninety+ Match Intelligence
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-400">2026/27 Campaign</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-[#00ff85]">Actual xG Dixon–Coles & XGBoost Tri-Hybrid</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
            Quantitative match outcomes, Expected Goals (xG), and exact score projections are calibrated probabilistic model estimates.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
