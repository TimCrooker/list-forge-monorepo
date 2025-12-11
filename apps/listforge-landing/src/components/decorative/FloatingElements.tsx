'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Star, Circle } from 'lucide-react'

interface FloatingElementsProps {
  variant?: 'icons' | 'particles' | 'sparkles'
  className?: string
}

export function FloatingElements({ variant = 'sparkles', className = '' }: FloatingElementsProps) {
  if (variant === 'icons') {
    return <FloatingIcons className={className} />
  }

  if (variant === 'particles') {
    return <FloatingParticles className={className} />
  }

  return <FloatingSparkles className={className} />
}

function FloatingIcons({ className }: { className?: string }) {
  const icons = [
    { Icon: Sparkles, x: '5%', y: '30%', size: 24, delay: 0 },
    { Icon: Zap, x: '90%', y: '40%', size: 20, delay: 1 },
    { Icon: Star, x: '15%', y: '70%', size: 18, delay: 2 },
    { Icon: Circle, x: '85%', y: '65%', size: 16, delay: 1.5 },
  ]

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {icons.map(({ Icon, x, y, size, delay }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/20"
          style={{ left: x, top: y }}
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5 + index,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  )
}

function FloatingParticles({ className }: { className?: string }) {
  const particles = Array.from({ length: 15 }, () => ({
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 4,
  }))

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function FloatingSparkles({ className }: { className?: string }) {
  const sparkles = [
    { x: '10%', y: '25%', delay: 0 },
    { x: '88%', y: '35%', delay: 0.5 },
    { x: '25%', y: '80%', delay: 1 },
    { x: '75%', y: '75%', delay: 1.5 },
    { x: '50%', y: '15%', delay: 2 },
  ]

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {sparkles.map((sparkle, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: sparkle.x, top: sparkle.y }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-primary/40"
          >
            <path
              d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
