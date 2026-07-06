// Small, dependency-free color helpers used to make custom colors
// (arbitrary background / font colors picked by the user) auto-adjust
// the rest of the UI so text always stays readable.
import type { CSSProperties } from 'react';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num) || clean.length !== 6) {
    return { r: 20, g: 20, b: 20 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// WCAG-style relative luminance (0 = black, 1 = white)
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Whether a given color counts as "light" (so dark text/UI should sit on top of it)
export function isColorLight(hex?: string): boolean {
  if (!hex) return false;
  return getLuminance(hex) > 0.5;
}

function toRgbaString(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Builds a small set of CSS custom properties (primary/secondary/muted text
// tiers, all derived from a single chosen font color) that can be spread
// onto a root element's inline style and consumed via `text-[var(--fd-...)]`
// utility classes further down the tree.
export function getFontColorVars(hex: string): Record<string, string> {
  return {
    '--fd-font': hex,
    '--fd-font-secondary': toRgbaString(hex, 0.75),
    '--fd-font-muted': toRgbaString(hex, 0.55),
  };
}

// Base background hex for every built-in preset theme. Previously only
// 'sand' was treated as a "light" theme, which is why desert-beige (also a
// light background) still rendered white headings - it fell through to the
// dark-mode branch by default. Deriving isLightTheme from the actual color
// of whichever theme is active (instead of a hardcoded name or two) fixes
// that for every preset, current and future.
const THEME_BASE_COLOR: Record<string, string> = {
  'sophisticated-dark': '#0A0A0A',
  'desert-beige': '#F5F2EB',
  mocha: '#1A1615',
  'royal-purple': '#221432',
  'deep-blue': '#0A1128',
  slate: '#020617',
  nord: '#18181B',
  sand: '#FFFBEB',
  'warm-dark': '#0C0A09',
  obsidian: '#000000',
  forest: '#022C22',
  'gradient-mesh': '#020617',
  'custom-image': '#0A0A0A', // dark overlay is drawn on top regardless of the photo
};

interface ThemeLike {
  themeBg?: string;
  glassTheme?: 'light' | 'dark';
  customBgColor?: string;
}

// Single source of truth for "is the current theme light" - every component
// should call this instead of re-deriving it locally so presets, liquid
// glass, and custom colors all stay in sync.
export function getIsLightTheme(settings: ThemeLike): boolean {
  if (!settings?.themeBg) return false;
  if (settings.themeBg === 'liquid-glass') return settings.glassTheme === 'light';
  if (settings.themeBg === 'custom-color') return isColorLight(settings.customBgColor);
  const base = THEME_BASE_COLOR[settings.themeBg];
  return base ? isColorLight(base) : false;
}

// A real macOS-style "liquid glass" panel needs more than a flat blurred
// rgba fill - it needs a strong blur+saturation boost (so colors behind it
// stay vivid instead of washing out), a soft brightness lift, and a subtle
// top-edge highlight to sell the sense of a curved, lit glass surface.
// This returns the base style; pair it with the `.liquid-glass-panel`
// class (see index.css) which adds the sheen/noise layer via ::before so
// there's no banding or flicker on repaint.
export function getLiquidGlassStyle(
  transparency: number, // 0-100, higher = more see-through
  theme: 'light' | 'dark'
): CSSProperties {
  const clarity = Math.min(Math.max(transparency, 0), 100) / 100;
  const opacity = 1 - clarity; // fill opacity, inverse of transparency
  const isLight = theme === 'light';
  // The dark variant deliberately uses a mid-gray (not near-black) fill.
  // The liquid-glass background gradient is itself almost black, so a
  // near-black rgba fill on top of it barely changes visually no matter
  // the alpha - the panel needs a color that actually contrasts against
  // the backdrop for the transparency slider to read as a visible change.
  const fill = isLight
    ? `rgba(255, 255, 255, ${0.1 + opacity * 0.78})`
    : `rgba(66, 66, 76, ${0.12 + opacity * 0.74})`;
  const blur = 20 + clarity * 14; // more transparent glass reads better with a touch more blur
  return {
    backgroundColor: fill,
    backdropFilter: `blur(${blur}px) saturate(165%) brightness(${isLight ? 1.04 : 1.08})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(165%) brightness(${isLight ? 1.04 : 1.08})`,
    border: `1px solid ${isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)'}`,
    boxShadow: isLight
      ? 'inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1px 12px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.10)'
      : 'inset 0 1px 1px rgba(255,255,255,0.16), inset 0 -1px 14px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.35)',
  };
}
