import type { ClubInfo } from '../types';

interface ClubBadgeProps {
  club: ClubInfo;
  size?: 'small' | 'medium' | 'large';
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({ club, size = 'medium' }) => (
  <span
    className={`club-badge club-badge-${size}`}
    style={{ backgroundColor: club.primaryColor, color: club.accentColor }}
    role="img"
    aria-label={`${club.name} crest`}
  >
    <span>{club.shortName}</span>
  </span>
);
