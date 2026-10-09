import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 56, height: 56 },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl p-1 shadow-lg transition-transform duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #202a3e 0%, #111827 100%)',
          border: '1px solid rgba(215, 243, 106, .35)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, .35), inset 0 1px 1px rgba(255, 255, 255, .08)',
        }}
      >
        <svg
          width={iconDimensions.width}
          height={iconDimensions.height}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_2px_8px_rgba(215,243,106,0.3)]"
        >
          <defs>
            {/* Citron and ice-blue identity gradient */}
            <linearGradient id="plMintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d7f36a" />
              <stop offset="60%" stopColor="#a9e77b" />
              <stop offset="100%" stopColor="#75d8ee" />
            </linearGradient>

            {/* Stadium Shield Gradient */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#273449" stopOpacity="1" />
              <stop offset="100%" stopColor="#111827" stopOpacity="1" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shield Outer Contour */}
          <path
            d="M32 4L54 13V33C54 46.5 44.5 56.5 32 60C19.5 56.5 10 46.5 10 33V13L32 4Z"
            fill="url(#shieldGrad)"
            stroke="url(#plMintGrad)"
            strokeWidth="1.8"
          />

          {/* Inner Geometric Predictive Grid Arcs */}
          <path
            d="M20 22C24 18 40 18 44 22M16 32C22 28 42 28 48 32M20 42C24 46 40 46 44 42"
            stroke="rgba(215, 243, 106, 0.22)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />

          {/* Stylized Modern Lion Crown Motif */}
          <path
            d="M23 20L27 27L32 17L37 27L41 20L43 30H21L23 20Z"
            fill="url(#plMintGrad)"
          />

          {/* Central AI Analytics Diamond Core / Ball Node */}
          <circle cx="32" cy="38" r="4.5" fill="#d7f36a" filter="url(#neonGlow)" />
          <circle cx="32" cy="38" r="2" fill="#ffffff" />

          {/* Prediction Pulse Rings */}
          <circle
            cx="32"
            cy="38"
            r="8.5"
            stroke="#75d8ee"
            strokeWidth="1"
            strokeOpacity="0.55"
            strokeDasharray="3 3"
          />

          {/* Dynamic Velocity Sparks */}
          <circle cx="21" cy="34" r="1.2" fill="#75d8ee" opacity="0.9" />
          <circle cx="43" cy="34" r="1.2" fill="#75d8ee" opacity="0.9" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-lg font-black tracking-[-0.04em] text-white">
              PREMIER<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff85] to-[#00f5d4]">AI</span>
            </span>
            <span className="rounded-md border border-[#00ff85]/30 bg-[#00ff85]/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#00ff85]">
              PRO
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
            xG Match Predictor
          </span>
        </div>
      )}
    </div>
  );
};
