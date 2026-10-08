import React, { useState } from 'react';
import type { ClubInfo } from '../types';

interface ClubBadgeProps {
  club: ClubInfo;
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xlarge';
  showGlow?: boolean;
  className?: string;
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({
  club,
  size = 'medium',
  showGlow = false,
  className = '',
}) => {
  const [imgErrorStage, setImgErrorStage] = useState<number>(0);

  // Size specifications
  const sizeMap = {
    xs: { px: 22, text: 'text-[9px]', shieldW: 'w-[22px]', shieldH: 'h-[24px]' },
    small: { px: 32, text: 'text-[10px]', shieldW: 'w-[32px]', shieldH: 'h-[36px]' },
    medium: { px: 44, text: 'text-[12px]', shieldW: 'w-[44px]', shieldH: 'h-[48px]' },
    large: { px: 64, text: 'text-[14px]', shieldW: 'w-[64px]', shieldH: 'h-[70px]' },
    xlarge: { px: 84, text: 'text-[18px]', shieldW: 'w-[84px]', shieldH: 'h-[92px]' },
  };

  const currentSize = sizeMap[size];

  // Try primary logo (stage 0), then alternate logo (stage 1), then fallback to colors (stage 2)
  const currentSrc =
    imgErrorStage === 0
      ? club.logoUrl
      : imgErrorStage === 1
      ? club.altLogoUrl
      : null;

  const handleImgError = () => {
    setImgErrorStage((prev) => prev + 1);
  };

  const glowStyle = showGlow
    ? {
        filter: `drop-shadow(0 0 12px ${club.primaryColor}55) drop-shadow(0 4px 8px rgba(0,0,0,0.5))`,
      }
    : {
        filter: `drop-shadow(0 3px 6px rgba(0,0,0,0.35))`,
      };

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 select-none ${className}`}
      style={glowStyle}
      role="img"
      aria-label={`${club.name} crest`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={club.name}
          width={currentSize.px}
          height={currentSize.px}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
          className="object-contain transition-opacity duration-200"
          style={{
            maxWidth: `${currentSize.px}px`,
            maxHeight: `${currentSize.px}px`,
            width: 'auto',
            height: 'auto',
          }}
        />
      ) : (
        /* Dynamic Team Colors Crest Fallback */
        <span
          className={`relative inline-flex items-center justify-center ${currentSize.shieldW} ${currentSize.shieldH} rounded-xl overflow-hidden font-black tracking-tight border shadow-inner`}
          style={{
            backgroundColor: club.primaryColor,
            borderColor: club.accentColor,
            color: club.accentColor === '#FFFFFF' || club.accentColor === '#ffffff' ? '#ffffff' : club.accentColor,
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.35)`,
          }}
        >
          {/* Subtle crest diagonal shine overlay */}
          <span
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%, rgba(0,0,0,0.4) 100%)`,
            }}
          />
          <span className={`relative z-10 font-black ${currentSize.text} uppercase drop-shadow`}>
            {club.shortName}
          </span>
        </span>
      )}
    </span>
  );
};
