import { BarChart3, CalendarDays, CircleDot, Trophy } from 'lucide-react';

interface NavbarProps {
  activeTab: 'arena' | 'gameweek' | 'rankings';
  setActiveTab: (tab: 'arena' | 'gameweek' | 'rankings') => void;
}

const tabs = [
  { id: 'arena', label: 'Matchroom', icon: Trophy },
  { id: 'gameweek', label: 'Fixtures', icon: CalendarDays },
  { id: 'rankings', label: 'Rankings', icon: BarChart3 },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => (
  <header className="topbar sticky top-0 z-50">
    <div className="mx-auto flex min-h-[76px] w-[min(100%-40px,1240px)] items-center justify-between gap-6">
      <button
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={() => setActiveTab('arena')}
        aria-label="PremierAI home"
      >
        <span className="brand-mark" aria-hidden="true"><span className="brand-monogram">PL</span></span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-[16px] font-black tracking-[-0.055em] text-white sm:text-[18px]">
              PREMIER<span className="text-[#00ff85]">AI</span>
            </span>
            <span className="hidden rounded-full border border-[#00ff85]/20 bg-[#00ff85]/[0.07] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#00ff85] sm:inline">
              Matchroom
            </span>
          </span>
          <span className="hidden text-[10px] font-medium text-slate-500 sm:block">
            Premier League intelligence, in play
          </span>
        </span>
      </button>

      <nav aria-label="Main navigation" className="topbar-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`topbar-link ${activeTab === id ? 'is-active' : ''}`}
          >
            <Icon size={14} strokeWidth={2.2} />
            <span className={id === 'rankings' ? 'hidden sm:inline' : ''}>{label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden min-w-[128px] items-center justify-end gap-2 text-[10px] font-semibold text-slate-400 md:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff85] opacity-40" />
          <CircleDot className="relative h-2 w-2 text-[#00ff85]" fill="currentColor" />
        </span>
        MODEL ONLINE
      </div>
    </div>
  </header>
);
