'use client'

import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef, useEffect } from 'react'

export interface CountUpProps {
  end: number
  duration?: number
  delay?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  once?: boolean
}

export function CountUp({
  end,
  duration = 2,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  once = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once, amount: 0.5 })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    // If decimals are specified, use them directly
    if (decimals > 0) {
      return latest.toFixed(decimals)
    }
    // Otherwise use automatic formatting for large numbers
    if (end >= 1000000) {
      return `${(latest / 1000000).toFixed(1)}M`
    }
    if (end >= 1000) {
      return `${(latest / 1000).toFixed(latest >= 10000 ? 0 : 1)}K`
    }
    return Math.round(latest).toString()
  })

  useEffect(() => {
    if (isInView) {
      const timeoutId = setTimeout(() => {
        const controls = animate(count, end, {
          duration,
          ease: [0.25, 0.1, 0.25, 1] as const,
        })
        return controls.stop
      }, delay * 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [isInView, end, duration, delay, count])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}
