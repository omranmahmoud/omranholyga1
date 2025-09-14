
import type { Hero as HeroType } from '../../types/store';

export interface HeroProps {}

export interface HeroContentProps {
  hero: HeroType;
}

export interface HeroTitleProps {
  title: string;
  subtitle: string;
}

export interface HeroActionsProps {
  primaryText: string;
  secondaryText: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export interface HeroImageProps {
  image: string;
}

export interface BadgeProps {
  className?: string;
}

export interface TrustBadgeProps {
  icon: React.ElementType;
  value: string;
  label: string;
}
