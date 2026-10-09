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
    sm: { width: 48, height: 40 },
    md: { width: 58, height: 44 },
    lg: { width: 72, height: 54 },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="90+ football substitution board logo"
      >
        <defs>
          <filter id="subBoardGlow" x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M33 12V8C33 5.8 34.8 4 37 4H43C45.2 4 47 5.8 47 8V12" stroke="#DDE7F3" strokeWidth="2.2" strokeLinecap="round" />
        <rect y="12" width="80" height="37" rx="5" fill="#273548" stroke="#8B9AAF" strokeWidth="1.5" />
        <path d="M5 16H75" stroke="#C4D0DF" strokeOpacity=".65" strokeWidth="1" />
        <rect x="4" y="18" width="72" height="27" rx="2.5" fill="#071018" stroke="#101923" strokeWidth="1" />
        <text x="48" y="36" textAnchor="end" fill="#FF3547" filter="url(#subBoardGlow)" fontFamily="monospace" fontSize="22" fontWeight="900" letterSpacing="-2.2">90</text>
        <text x="49" y="36" textAnchor="start" fill="#28F28B" filter="url(#subBoardGlow)" fontFamily="monospace" fontSize="22" fontWeight="900">+</text>
        <path d="M29 49V54M51 49V54" stroke="#A8B4C6" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-[-0.04em] leading-none text-white">Ninety<span className="text-[#d7f36a]">+</span></span>
          <span className="text-[10px] font-semibold tracking-wide text-slate-300 mt-1">
            Where Matchday Meets Data
          </span>
        </div>
      )}
    </div>
  );
};
