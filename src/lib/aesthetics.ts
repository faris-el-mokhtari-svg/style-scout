export type AestheticId = 'deine-leinwand' | 'old-money' | 'y2k' | 'casual' | 'streetwear';

export interface AestheticConfig {
  id: AestheticId;
  label: string;
  maxRotation: number;
  swipeExitDuration: number;
  standardDuration: number;
  microDuration: number;
  easing: string;
  bottomNavIndicator: 'underline' | 'pill' | 'fill';
}

export const AESTHETICS: Record<AestheticId, AestheticConfig> = {
  'deine-leinwand': {
    id: 'deine-leinwand',
    label: 'Deine Leinwand',
    maxRotation: 15,
    swipeExitDuration: 320,
    standardDuration: 240,
    microDuration: 160,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bottomNavIndicator: 'underline',
  },
  'old-money': {
    id: 'old-money',
    label: 'Old Money',
    maxRotation: 15,
    swipeExitDuration: 320,
    standardDuration: 320,
    microDuration: 200,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    bottomNavIndicator: 'underline',
  },
  'y2k': {
    id: 'y2k',
    label: 'Y2K',
    maxRotation: 20,
    swipeExitDuration: 240,
    standardDuration: 200,
    microDuration: 120,
    easing: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
    bottomNavIndicator: 'pill',
  },
  'casual': {
    id: 'casual',
    label: 'Casual',
    maxRotation: 15,
    swipeExitDuration: 280,
    standardDuration: 280,
    microDuration: 160,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bottomNavIndicator: 'pill',
  },
  'streetwear': {
    id: 'streetwear',
    label: 'Streetwear',
    maxRotation: 12,
    swipeExitDuration: 200,
    standardDuration: 180,
    microDuration: 80,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bottomNavIndicator: 'fill',
  },
};

export const DEFAULT_AESTHETIC: AestheticId = 'deine-leinwand';
