import { useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@listforge/ui';
import type { FoundryAvatarProps, FoundryState } from './types';
import {
  SIZE_MAP,
  SVG_VIEWBOX,
  CENTER,
  OUTER_RING_RADIUS,
  OUTER_RING_STROKE_WIDTH,
  CORE_RADIUS,
  ORBIT_RADIUS,
  DOT_RADIUS,
  RING_HIGHLIGHT,
  CORE_MID_COLOR,
  GLYPH_POSITIONS,
  GLYPH_RADIUS,
  ORBIT_DURATION_TYPING,
  ORBIT_DURATION_THINKING,
  CORE_BREATH_DURATION,
  CORE_BREATH_DURATION_LISTENING,
  CORE_BREATH_INTENSITY,
  SHAKE_ERROR_INTENSITY_PX,
  SHAKE_ERROR_DURATION,
  SENT_ANIMATION_DURATION,
  ERROR_FLICKER_DURATION,
  mergeColors,
} from './constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert angle in degrees to position on a circle.
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * The outer ring (forge housing).
 */
function OuterRing({ color }: { color: string }) {
  return (
    <>
      {/* Main ring */}
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={OUTER_RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={OUTER_RING_STROKE_WIDTH}
      />
      {/* Inner highlight/shadow for depth */}
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={OUTER_RING_RADIUS - OUTER_RING_STROKE_WIDTH / 2 + 1}
        fill="none"
        stroke={RING_HIGHLIGHT}
        strokeWidth={1}
        opacity={0.3}
      />
    </>
  );
}

/**
 * Optional chat bubble tail.
 */
function ChatTail({ color }: { color: string }) {
  return (
    <path
      d="M 72 82 Q 78 88 82 94 Q 76 90 68 86 Z"
      fill={color}
    />
  );
}

/**
 * The inner molten core with radial gradient.
 */
function CoreGradientDefs({
  id,
  centerColor,
  edgeColor,
}: {
  id: string;
  centerColor: string;
  edgeColor: string;
}) {
  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%" fx="45%" fy="45%">
        <stop offset="0%" stopColor={centerColor} />
        <stop offset="40%" stopColor={CORE_MID_COLOR} />
        <stop offset="100%" stopColor={edgeColor} />
      </radialGradient>
      {/* Glow filter for the core */}
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/**
 * The molten core circle.
 */
interface CoreProps {
  gradientId: string;
  state: FoundryState;
  errorColor: string;
}

function Core({ gradientId, state, errorColor }: CoreProps) {
  const isError = state === 'error';
  const isListening = state === 'listening';
  const isSent = state === 'sent';

  // Breathing animation variants
  const breatheVariants = {
    idle: {
      scale: [1, 1 + CORE_BREATH_INTENSITY, 1],
      transition: {
        duration: CORE_BREATH_DURATION,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    listening: {
      scale: [1, 1 + CORE_BREATH_INTENSITY * 1.2, 1],
      transition: {
        duration: CORE_BREATH_DURATION_LISTENING,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    typing: {
      scale: [1, 1 + CORE_BREATH_INTENSITY * 0.8, 1],
      transition: {
        duration: CORE_BREATH_DURATION * 0.9,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    thinking: {
      scale: [1, 1 + CORE_BREATH_INTENSITY * 1.5, 1],
      transition: {
        duration: CORE_BREATH_DURATION * 1.2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    sent: {
      scale: [1, 1.15, 1],
      transition: {
        duration: SENT_ANIMATION_DURATION,
        ease: 'easeOut' as const,
      },
    },
    error: {
      scale: 1,
    },
  };

  // Error flicker animation
  const errorFlickerVariants = {
    flicker: {
      fill: [`url(#${gradientId})`, errorColor, `url(#${gradientId})`, errorColor],
      transition: {
        duration: ERROR_FLICKER_DURATION * 4,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  return (
    <motion.g
      style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
      variants={breatheVariants}
      animate={isError ? 'error' : isSent ? 'sent' : isListening ? 'listening' : state}
      initial="idle"
    >
      <motion.circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={CORE_RADIUS}
        fill={`url(#${gradientId})`}
        filter={`url(#${gradientId}-glow)`}
        variants={isError ? errorFlickerVariants : undefined}
        animate={isError ? 'flicker' : undefined}
      />
    </motion.g>
  );
}

/**
 * Ecommerce glyphs positioned around the ring.
 */
function EcommerceGlyphs() {
  const glyphColor = RING_HIGHLIGHT;
  const strokeWidth = 1.5;

  // Calculate positions for each glyph
  const cartPos = polarToCartesian(CENTER.x, CENTER.y, GLYPH_RADIUS, GLYPH_POSITIONS.cart);
  const tagPos = polarToCartesian(CENTER.x, CENTER.y, GLYPH_RADIUS, GLYPH_POSITIONS.tag);
  const boxPos = polarToCartesian(CENTER.x, CENTER.y, GLYPH_RADIUS, GLYPH_POSITIONS.box);
  const barcodePos = polarToCartesian(CENTER.x, CENTER.y, GLYPH_RADIUS, GLYPH_POSITIONS.barcode);

  return (
    <g opacity={0.4} strokeWidth={strokeWidth} stroke={glyphColor} fill="none">
      {/* Cart icon (simplified) */}
      <g transform={`translate(${cartPos.x - 4}, ${cartPos.y - 4}) scale(0.35)`}>
        <path d="M0 3h2l2 9h12l2-6H6" />
        <circle cx={8} cy={15} r={1.5} />
        <circle cx={14} cy={15} r={1.5} />
      </g>

      {/* Tag icon (simplified) */}
      <g transform={`translate(${tagPos.x - 4}, ${tagPos.y - 4}) scale(0.35)`}>
        <path d="M2 2l8 0l6 6l-6 6l-6-6l0-6z" />
        <circle cx={6} cy={6} r={1.5} />
      </g>

      {/* Box icon (simplified) */}
      <g transform={`translate(${boxPos.x - 4}, ${boxPos.y - 4}) scale(0.35)`}>
        <path d="M2 6l8-4l8 4l0 10l-8 4l-8-4z" />
        <path d="M10 2l0 18" />
        <path d="M2 6l8 4l8-4" />
      </g>

      {/* Barcode icon (simplified lines) */}
      <g transform={`translate(${barcodePos.x - 4}, ${barcodePos.y - 3}) scale(0.35)`}>
        <path d="M2 2v12M5 2v12M8 2v8M11 2v12M14 2v8M17 2v12M20 2v12" />
      </g>
    </g>
  );
}

/**
 * Orbiting dots for typing/thinking states.
 */
interface OrbitingDotsProps {
  state: FoundryState;
  coreEdgeColor: string;
}

function OrbitingDots({ state, coreEdgeColor }: OrbitingDotsProps) {
  const showDots = state === 'typing' || state === 'thinking';
  const orbitDuration = state === 'thinking' ? ORBIT_DURATION_THINKING : ORBIT_DURATION_TYPING;

  // Calculate initial positions for 3 dots (120° apart)
  const dot1Pos = polarToCartesian(CENTER.x, CENTER.y, ORBIT_RADIUS, 0);
  const dot2Pos = polarToCartesian(CENTER.x, CENTER.y, ORBIT_RADIUS, 120);
  const dot3Pos = polarToCartesian(CENTER.x, CENTER.y, ORBIT_RADIUS, 240);

  return (
    <AnimatePresence>
      {showDots && (
        <motion.g
          style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 360,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
            rotate: {
              duration: orbitDuration,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          {/* Dot 1 */}
          <motion.circle
            cx={dot1Pos.x}
            cy={dot1Pos.y}
            r={DOT_RADIUS}
            fill={coreEdgeColor}
            animate={{
              r: [DOT_RADIUS, DOT_RADIUS * 1.2, DOT_RADIUS],
            }}
            transition={{
              duration: orbitDuration / 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Dot 2 */}
          <motion.circle
            cx={dot2Pos.x}
            cy={dot2Pos.y}
            r={DOT_RADIUS}
            fill={coreEdgeColor}
            animate={{
              r: [DOT_RADIUS, DOT_RADIUS * 1.2, DOT_RADIUS],
            }}
            transition={{
              duration: orbitDuration / 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: orbitDuration / 9,
            }}
          />
          {/* Dot 3 */}
          <motion.circle
            cx={dot3Pos.x}
            cy={dot3Pos.y}
            r={DOT_RADIUS}
            fill={coreEdgeColor}
            animate={{
              r: [DOT_RADIUS, DOT_RADIUS * 1.2, DOT_RADIUS],
            }}
            transition={{
              duration: orbitDuration / 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (orbitDuration / 9) * 2,
            }}
          />
        </motion.g>
      )}
    </AnimatePresence>
  );
}

/**
 * Pour effect for sent state - molten metal dripping down.
 */
interface PourEffectProps {
  state: FoundryState;
  coreEdgeColor: string;
  onComplete?: () => void;
}

function PourEffect({ state, coreEdgeColor, onComplete }: PourEffectProps) {
  const showPour = state === 'sent';

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {showPour && (
        <motion.g>
          {/* Pour streak */}
          <motion.rect
            x={CENTER.x - 2}
            y={CENTER.y + CORE_RADIUS - 5}
            width={4}
            height={0}
            rx={2}
            fill={coreEdgeColor}
            initial={{ height: 0, opacity: 1 }}
            animate={{
              height: [0, 25, 25],
              opacity: [1, 1, 0],
              y: [CENTER.y + CORE_RADIUS - 5, CENTER.y + CORE_RADIUS + 5, CENTER.y + CORE_RADIUS + 15],
            }}
            transition={{
              duration: SENT_ANIMATION_DURATION,
              ease: 'easeOut',
            }}
          />
          {/* Drip at the end */}
          <motion.circle
            cx={CENTER.x}
            cy={CENTER.y + CORE_RADIUS + 20}
            r={0}
            fill={coreEdgeColor}
            initial={{ r: 0, opacity: 1 }}
            animate={{
              r: [0, 3, 2],
              opacity: [0, 1, 0],
              cy: [CENTER.y + CORE_RADIUS + 15, CENTER.y + CORE_RADIUS + 30, CENTER.y + CORE_RADIUS + 40],
            }}
            transition={{
              duration: SENT_ANIMATION_DURATION * 0.8,
              delay: SENT_ANIMATION_DURATION * 0.3,
              ease: 'easeIn',
            }}
          />
        </motion.g>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * FoundryAvatar - A stylized forge/furnace avatar for the Foundry AI assistant.
 *
 * The avatar displays different animations based on its state:
 * - `idle`: Gentle breathing glow
 * - `listening`: Attentive, slightly brighter
 * - `typing`: Orbiting dots indicate generation
 * - `thinking`: Slower orbit for long-running tasks
 * - `sent`: Brief pour/completion animation
 * - `error`: Shake and color flicker
 */
export function FoundryAvatar({
  state,
  size = 'md',
  mode = 'dark',
  className,
  colors: customColors,
  showTail = false,
  onSentAnimationComplete,
}: FoundryAvatarProps) {
  const pixelSize = SIZE_MAP[size];
  const colors = mergeColors(mode, customColors);
  const gradientId = useId().replace(/:/g, '');

  // Handle sent animation completion
  const handlePourComplete = useCallback(() => {
    onSentAnimationComplete?.();
  }, [onSentAnimationComplete]);

  // Error shake animation for wrapper
  const shakeAnimation = state === 'error'
    ? {
        x: [0, -SHAKE_ERROR_INTENSITY_PX, SHAKE_ERROR_INTENSITY_PX, -SHAKE_ERROR_INTENSITY_PX, 0],
      }
    : { x: 0 };

  const shakeTransition = state === 'error'
    ? {
        duration: SHAKE_ERROR_DURATION,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: 'easeInOut' as const,
      }
    : undefined;

  return (
    <motion.div
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width: pixelSize, height: pixelSize }}
      animate={shakeAnimation}
      transition={shakeTransition}
      aria-label={`Foundry assistant ${state}`}
      role="img"
    >
      <svg
        viewBox={SVG_VIEWBOX}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definitions */}
        <CoreGradientDefs
          id={gradientId}
          centerColor={colors.coreCenter}
          edgeColor={colors.coreEdge}
        />

        {/* Optional chat tail (behind ring) */}
        {showTail && <ChatTail color={colors.outerRing} />}

        {/* Outer ring (forge housing) */}
        <OuterRing color={colors.outerRing} />

        {/* Ecommerce glyphs on the ring */}
        <EcommerceGlyphs />

        {/* Inner molten core */}
        <Core
          gradientId={gradientId}
          state={state}
          errorColor={colors.errorCore}
        />

        {/* Orbiting dots for typing/thinking */}
        <OrbitingDots state={state} coreEdgeColor={colors.coreEdge} />

        {/* Pour effect for sent state */}
        <PourEffect
          state={state}
          coreEdgeColor={colors.coreEdge}
          onComplete={handlePourComplete}
        />
      </svg>
    </motion.div>
  );
}
