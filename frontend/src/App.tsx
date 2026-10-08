import { useState, useEffect } from 'react';
import type { TeamSnapshot } from './types';
import { Navbar } from './components/Navbar';
import { MatchArena } from './components/MatchArena';
import { GameWeekHub } from './components/GameWeekHub';
import { PowerRankings } from './components/PowerRankings';
import { Activity } from 'lucide-react';
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
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-400">
            <span className="brand-mark" aria-hidden="true"><Activity size={20} /></span>
            <span className="font-semibold text-sm animate-pulse text-[#00ff85]">
              Warming up the prediction engine…
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'arena' && <MatchArena teams={teams} />}
            {activeTab === 'gameweek' && <GameWeekHub />}
            {activeTab === 'rankings' && <PowerRankings />}
          </>
        )}
      </main>

      <footer className="app-footer py-7 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl space-y-2 px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 font-semibold">
            <span>PremierAI Matchroom</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#00ff85]">Built for the beautiful game</span>
          </div>
          <p className="text-[10px] text-slate-600">Forecasts are model estimates, not guarantees. Explore the numbers, then enjoy the match.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
