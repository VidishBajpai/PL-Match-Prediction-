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
    sm: { width: 36, height: 36 },
    md: { width: 44, height: 44 },
    lg: { width: 60, height: 60 },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl p-1 shadow-lg transition-transform duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(145deg, #202a3e 0%, #101827 100%)',
          border: '1px solid rgba(215, 243, 106, .38)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, .35), inset 0 1px 1px rgba(255, 255, 255, .08)',
        }}
      >
        <svg
          width={iconDimensions.width}
          height={iconDimensions.height}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="90+ football analytics logo"
        >
          <defs>
            <linearGradient id="ninetyPlusGradient" x1="5" y1="5" x2="58" y2="59" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D7F36A" />
              <stop offset="1" stopColor="#75D8EE" />
            </linearGradient>
          </defs>
          <path d="M32 4L55 13V33C55 46 45 56 32 60C19 56 9 46 9 33V13L32 4Z" fill="#101827" stroke="url(#ninetyPlusGradient)" strokeWidth="2" />
          <path d="M19 21H45M16 32H48M19 43H45" stroke="#D7F36A" strokeOpacity=".18" strokeWidth="1" />
          <text x="31" y="37" textAnchor="middle" fill="url(#ninetyPlusGradient)" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="900" letterSpacing="-1.5">90+</text>
          <path d="M22 46H42" stroke="#75D8EE" strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-[-0.04em] leading-none text-white">90<span className="text-[#d7f36a]">+</span></span>
          <span className="text-[10px] font-semibold tracking-wide text-slate-400 mt-1">
            Where matchday meets match data
          </span>
        </div>
      )}
    </div>
  );
};
