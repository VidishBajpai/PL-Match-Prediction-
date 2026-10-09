import React from 'react';
import { BarChart3, CalendarDays, CircleDot, Trophy } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: 'arena' | 'gameweek' | 'rankings';
  setActiveTab: (tab: 'arena' | 'gameweek' | 'rankings') => void;
}

const tabs = [
  { id: 'arena', label: 'Matchroom Arena', shortLabel: 'Arena', icon: Trophy },
  { id: 'gameweek', label: 'Fixtures Hub', shortLabel: 'Fixtures', icon: CalendarDays },
  { id: 'rankings', label: 'Power Rankings', shortLabel: 'Rankings', icon: BarChart3 },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => (
  <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#080d1a]/85 border-b border-slate-800/80 shadow-2xl shadow-black/40">
    <div className="mx-auto flex h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
      {/* Brand Clickable Area */}
      <button
        type="button"
        className="flex items-center text-left focus:outline-none group cursor-pointer"
        onClick={() => setActiveTab('arena')}
        aria-label="Ninety+ home"
      >
        <BrandLogo size="md" showText={true} />
      </button>

      {/* Navigation Pills */}
      <nav aria-label="Main navigation" className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-inner">
        {tabs.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#00ff85] to-[#00d2ff] text-slate-950 shadow-md shadow-[#00ff85]/20 font-black scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.6 : 2.0} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Live System Status */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff85] opacity-75" />
            <CircleDot className="relative h-2 w-2 text-[#00ff85]" fill="currentColor" />
          </span>
          <span>TRI-HYBRID xG ENGINE</span>
          <span className="text-[#00ff85] font-black">ONLINE</span>
        </div>
      </div>
    </div>
  </header>
);
