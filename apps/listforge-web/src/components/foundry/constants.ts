/**
 * Foundry Avatar Constants
 *
 * Animation durations, size mappings, and color palettes for the Foundry avatar.
 */

import type { FoundrySize, FoundryThemeMode, FoundryColors } from './types';

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

/**
 * Pixel sizes for each avatar size variant.
 */
export const SIZE_MAP: Record<FoundrySize, number> = {
  sm: 24,
  md: 40,
  lg: 64,
};

// ============================================================================
// ANIMATION DURATIONS (in seconds)
// ============================================================================

/** Duration of one full orbit rotation during typing state */
export const ORBIT_DURATION_TYPING = 1.8;

/** Duration of one full orbit rotation during thinking state (slower) */
export const ORBIT_DURATION_THINKING = 2.8;

/** Duration of one core breathing cycle */
export const CORE_BREATH_DURATION = 2.0;

/** Faster breathing duration for listening state */
export const CORE_BREATH_DURATION_LISTENING = 1.5;

/** Scale intensity for breathing animation (percentage as decimal) */
export const CORE_BREATH_INTENSITY = 0.04;

/** Horizontal shake distance in pixels for error state */
export const SHAKE_ERROR_INTENSITY_PX = 3;

/** Duration of error shake animation */
export const SHAKE_ERROR_DURATION = 0.4;

/** Duration of the sent animation sequence */
export const SENT_ANIMATION_DURATION = 0.35;

/** Duration of error flicker cycle */
export const ERROR_FLICKER_DURATION = 0.15;

// ============================================================================
// COLOR PALETTES
// ============================================================================

/**
 * Default colors for dark mode.
 */
export const DARK_MODE_COLORS: Required<FoundryColors> = {
  outerRing: '#111827', // Dark slate (gray-900)
  coreCenter: '#FFFBEB', // Near white / amber-50 (hottest)
  coreEdge: '#F97316', // Orange-500
  errorCore: '#DC2626', // Red-600
};

/**
 * Default colors for light mode.
 */
export const LIGHT_MODE_COLORS: Required<FoundryColors> = {
  outerRing: '#374151', // Gray-700 (slightly lighter for contrast)
  coreCenter: '#FEF3C7', // Amber-100
  coreEdge: '#F97316', // Orange-500
  errorCore: '#DC2626', // Red-600
};

/**
 * Get the default color palette based on theme mode.
 */
export function getDefaultColors(mode: FoundryThemeMode): Required<FoundryColors> {
  return mode === 'dark' ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;
}

/**
 * Merge custom colors with defaults.
 */
export function mergeColors(
  mode: FoundryThemeMode,
  customColors?: Partial<FoundryColors>
): Required<FoundryColors> {
  const defaults = getDefaultColors(mode);
  return {
    ...defaults,
    ...customColors,
  };
}

// ============================================================================
// SVG GEOMETRY
// ============================================================================

/** SVG viewBox dimensions */
export const SVG_VIEWBOX = '0 0 100 100';

/** Center point of the SVG */
export const CENTER = { x: 50, y: 50 };

/** Outer ring radius */
export const OUTER_RING_RADIUS = 46;

/** Outer ring stroke width */
export const OUTER_RING_STROKE_WIDTH = 8;

/** Inner core radius */
export const CORE_RADIUS = 30;

/** Radius of the orbit path for dots */
export const ORBIT_RADIUS = 35;

/** Radius of each orbiting dot */
export const DOT_RADIUS = 3.5;

/** Ring highlight color for subtle accent */
export const RING_HIGHLIGHT = '#4B5563'; // Gray-600

/** Mid gradient color for core */
export const CORE_MID_COLOR = '#FB923C'; // Orange-400

// ============================================================================
// ECOMMERCE GLYPH POSITIONS (angles in degrees)
// ============================================================================

/**
 * Positions for the ecommerce glyphs around the inner edge of the ring.
 * Each glyph is placed at a specific angle from the center.
 */
export const GLYPH_POSITIONS = {
  cart: 315, // Top-right area
  tag: 45, // Bottom-right area
  box: 135, // Bottom-left area
  barcode: 225, // Top-left area
} as const;

/** Radius at which glyphs are positioned (on inner edge of ring) */
export const GLYPH_RADIUS = 38;
