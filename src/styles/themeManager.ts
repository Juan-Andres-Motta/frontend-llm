/**
 * @fileoverview Gestor de temas de color
 *
 * Define las paletas de colores disponibles y aplica las variables CSS
 * correspondientes para personalizar el aspecto de la aplicación.
 */

export type ThemeKey = 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'violet';

export type ThemeDefinition = {
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  primaryMutedHover: string;
  primaryLight: string;
  gradientFrom: string;
  gradientTo: string;
};

const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const parsed = parseInt(value, 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `${r}, ${g}, ${b}`;
};

export const THEMES: Record<ThemeKey, ThemeDefinition> = {
  blue: {
    primary: '#2baae2',
    primaryHover: '#1e90c7',
    primaryMuted: '#1f8cbf',
    primaryMutedHover: '#18739d',
    primaryLight: '#7fc5e6',
    gradientFrom: '#2baae2',
    gradientTo: '#1f8cbf',
  },
  green: {
    primary: '#15803d',
    primaryHover: '#166534',
    primaryMuted: '#14532d',
    primaryMutedHover: '#0f3d20',
    primaryLight: '#b9f3ca',
    gradientFrom: '#15803d',
    gradientTo: '#166534',
  },
  yellow: {
    primary: '#a16207',
    primaryHover: '#854d0e',
    primaryMuted: '#713f12',
    primaryMutedHover: '#4c2f0b',
    primaryLight: '#fde68a',
    gradientFrom: '#f59e0b',
    gradientTo: '#b45309',
  },
  orange: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryMuted: '#c2410c',
    primaryMutedHover: '#9a3412',
    primaryLight: '#fed7aa',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
  },
  red: {
    primary: '#ef4444',
    primaryHover: '#dc2626',
    primaryMuted: '#b91c1c',
    primaryMutedHover: '#991b1b',
    primaryLight: '#fecaca',
    gradientFrom: '#ef4444',
    gradientTo: '#dc2626',
  },
  violet: {
    primary: '#6d28d9',
    primaryHover: '#5b21b6',
    primaryMuted: '#4c1d95',
    primaryMutedHover: '#3b0f7f',
    primaryLight: '#e7d8ff',
    gradientFrom: '#7c3aed',
    gradientTo: '#5b21b6',
  },
};

export const applyTheme = (theme: ThemeKey) => {
  if (typeof document === 'undefined') {
    return;
  }

  const palette = THEMES[theme] ?? THEMES.blue;
  const root = document.documentElement;

  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-primary-hover', palette.primaryHover);
  root.style.setProperty('--color-primary-muted', palette.primaryMuted);
  root.style.setProperty('--color-primary-muted-hover', palette.primaryMutedHover);
  root.style.setProperty('--color-primary-light', palette.primaryLight);
  root.style.setProperty('--color-primary-gradient-from', palette.gradientFrom);
  root.style.setProperty('--color-primary-gradient-to', palette.gradientTo);
  root.style.setProperty('--color-primary-rgb', hexToRgb(palette.primary));
  root.style.setProperty('--tw-ring-color', palette.primary);
};

export const updateThemeMetaColor = (theme: ThemeKey) => {
  if (typeof document === 'undefined') {
    return;
  }

  const palette = THEMES[theme] ?? THEMES.blue;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const metaMsTile = document.querySelector('meta[name="msapplication-TileColor"]');

  if (metaTheme) {
    metaTheme.setAttribute('content', palette.primary);
  }

  if (metaMsTile) {
    metaMsTile.setAttribute('content', palette.primary);
  }
};
