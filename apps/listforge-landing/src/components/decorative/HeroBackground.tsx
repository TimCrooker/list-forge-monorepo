'use client'

import { motion } from 'framer-motion'
import { GradientOrbs } from './GradientOrbs'
import { GridPattern } from './GridPattern'

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

      {/* Radial gradient from top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent)',
        }}
      />

      {/* Animated gradient orbs */}
      <GradientOrbs variant="hero" />

      {/* Grid pattern overlay */}
      <GridPattern variant="dots" className="opacity-60" />

      {/* Floating geometric shapes */}
      <FloatingShapes />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}

function FloatingShapes() {
  const shapes = [
    { size: 40, x: '10%', y: '20%', delay: 0, duration: 6 },
    { size: 60, x: '85%', y: '30%', delay: 1, duration: 8 },
    { size: 30, x: '70%', y: '70%', delay: 2, duration: 7 },
    { size: 50, x: '20%', y: '75%', delay: 3, duration: 9 },
    { size: 25, x: '50%', y: '10%', delay: 0.5, duration: 6.5 },
  ]

  return (
    <>
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {index % 3 === 0 ? (
            <div className="w-full h-full rounded-full border border-primary/20" />
          ) : index % 3 === 1 ? (
            <div className="w-full h-full rotate-45 border border-primary/15" />
          ) : (
            <div className="w-full h-full rounded-lg border border-primary/10" />
          )}
        </motion.div>
      ))}
    </>
  )
}
