'use client'

import { motion, type Transition } from 'framer-motion'
import { type ReactNode } from 'react'

interface GlowEffectProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'teal' | 'cyan' | 'white'
  intensity?: 'soft' | 'medium' | 'strong'
  animate?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
  xl: 'w-[500px] h-[500px]',
}

const colorMap = {
  primary: 'from-primary/40 via-primary/20 to-transparent',
  teal: 'from-teal-400/40 via-teal-400/20 to-transparent',
  cyan: 'from-cyan-400/40 via-cyan-400/20 to-transparent',
  white: 'from-white/20 via-white/10 to-transparent',
}

const intensityMap = {
  soft: 'blur-2xl opacity-50',
  medium: 'blur-3xl opacity-70',
  strong: 'blur-3xl opacity-90',
}

export function GlowEffect({
  size = 'md',
  color = 'primary',
  intensity = 'medium',
  animate = true,
  className = '',
}: GlowEffectProps) {
  if (!animate) {
    return (
      <div
        className={`absolute rounded-full bg-gradient-radial ${sizeMap[size]} ${colorMap[color]} ${intensityMap[intensity]} pointer-events-none ${className}`}
      />
    )
  }

  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-radial ${sizeMap[size]} ${colorMap[color]} ${intensityMap[intensity]} pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.7, 0.9, 0.7],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      } as Transition}
    />
  )
}

// Specialized glow for buttons/CTAs - wraps children with glow effect
export function ButtonGlow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10 rounded-xl bg-primary/20 blur-xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        } as Transition}
      />
      {children}
    </div>
  )
}
