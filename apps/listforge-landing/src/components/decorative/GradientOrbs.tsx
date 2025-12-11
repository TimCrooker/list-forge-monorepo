'use client'

import { motion } from 'framer-motion'

interface GradientOrbsProps {
  variant?: 'hero' | 'section' | 'subtle' | 'scattered' | 'centered'
  className?: string
}

export function GradientOrbs({ variant = 'hero', className = '' }: GradientOrbsProps) {
  const variants = {
    hero: {
      orbs: [
        {
          size: 'w-[600px] h-[600px]',
          position: '-top-48 -right-48',
          color: 'from-primary/30 to-teal-400/20',
          delay: 0,
        },
        {
          size: 'w-[500px] h-[500px]',
          position: '-bottom-32 -left-32',
          color: 'from-primary/20 to-cyan-400/10',
          delay: 2,
        },
        {
          size: 'w-[300px] h-[300px]',
          position: 'top-1/3 left-1/4',
          color: 'from-teal-400/15 to-transparent',
          delay: 4,
        },
      ],
    },
    section: {
      orbs: [
        {
          size: 'w-[400px] h-[400px]',
          position: '-top-32 -right-32',
          color: 'from-primary/20 to-transparent',
          delay: 0,
        },
        {
          size: 'w-[300px] h-[300px]',
          position: '-bottom-24 -left-24',
          color: 'from-teal-400/15 to-transparent',
          delay: 1,
        },
      ],
    },
    subtle: {
      orbs: [
        {
          size: 'w-[200px] h-[200px]',
          position: 'top-0 right-0',
          color: 'from-primary/10 to-transparent',
          delay: 0,
        },
      ],
    },
    scattered: {
      orbs: [
        {
          size: 'w-[250px] h-[250px]',
          position: 'top-10 left-10',
          color: 'from-primary/15 to-transparent',
          delay: 0,
        },
        {
          size: 'w-[200px] h-[200px]',
          position: 'bottom-20 right-20',
          color: 'from-teal-400/15 to-transparent',
          delay: 1.5,
        },
        {
          size: 'w-[180px] h-[180px]',
          position: 'top-1/2 right-1/4',
          color: 'from-primary/10 to-transparent',
          delay: 3,
        },
      ],
    },
    centered: {
      orbs: [
        {
          size: 'w-[500px] h-[500px]',
          position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          color: 'from-primary/20 to-teal-400/10',
          delay: 0,
        },
        {
          size: 'w-[300px] h-[300px]',
          position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          color: 'from-teal-400/15 to-transparent',
          delay: 2,
        },
      ],
    },
  }

  const config = variants[variant]

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {config.orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute ${orb.size} ${orb.position} rounded-full bg-gradient-radial ${orb.color} blur-3xl`}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            delay: orb.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
