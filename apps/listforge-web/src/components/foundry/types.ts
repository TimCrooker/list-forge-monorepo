/**
 * Foundry Avatar Types
 *
 * Type definitions for the Foundry AI assistant avatar component.
 */

/**
 * The current state of the Foundry avatar, determining which animation to display.
 *
 * - `idle`: Default state with gentle breathing animation
 * - `listening`: User is typing, avatar shows attentiveness
 * - `typing`: Assistant is generating a response (normal)
 * - `thinking`: Assistant is processing a long-running task
 * - `sent`: Brief completion animation after response is sent
 * - `error`: Error state with shake and color flicker
 */
export type FoundryState =
  | 'idle'
  | 'listening'
  | 'typing'
  | 'thinking'
  | 'sent'
  | 'error';

/**
 * Available sizes for the Foundry avatar.
 *
 * - `sm`: 24x24 pixels
 * - `md`: 40x40 pixels
 * - `lg`: 64x64 pixels
 */
export type FoundrySize = 'sm' | 'md' | 'lg';

/**
 * Theme mode for the Foundry avatar.
 */
export type FoundryThemeMode = 'light' | 'dark';

/**
 * Custom color overrides for the Foundry avatar.
 */
export interface FoundryColors {
  /** Color for the outer ring (forge housing) */
  outerRing?: string;
  /** Color for the center of the core gradient (hottest point) */
  coreCenter?: string;
  /** Color for the edge of the core gradient */
  coreEdge?: string;
  /** Color for the core during error state */
  errorCore?: string;
}

/**
 * Props for the FoundryAvatar component.
 */
export interface FoundryAvatarProps {
  /**
   * The current state of the avatar, controlling which animation is displayed.
   */
  state: FoundryState;

  /**
   * Size of the avatar.
   * @default 'md'
   */
  size?: FoundrySize;

  /**
   * Theme mode affecting default colors.
   * @default 'dark'
   */
  mode?: FoundryThemeMode;

  /**
   * Optional className for the wrapper div.
   */
  className?: string;

  /**
   * Optional color overrides.
   */
  colors?: FoundryColors;

  /**
   * Whether to show the chat bubble tail at bottom-right.
   * @default false
   */
  showTail?: boolean;

  /**
   * Callback fired when the 'sent' animation completes.
   * Useful for transitioning back to 'idle' state.
   */
  onSentAnimationComplete?: () => void;
}

/**
 * Props for the FoundryTypingIndicator component.
 */
export interface FoundryTypingIndicatorProps {
  /**
   * The typing/thinking state to display.
   */
  state: Extract<FoundryState, 'typing' | 'thinking'>;

  /**
   * Optional label text to display next to the avatar.
   * @default "Foundry is generating..."
   */
  label?: string;

  /**
   * Size of the avatar.
   * @default 'sm'
   */
  size?: FoundrySize;

  /**
   * Theme mode affecting default colors.
   * @default 'dark'
   */
  mode?: FoundryThemeMode;

  /**
   * Optional className for the wrapper div.
   */
  className?: string;
}
