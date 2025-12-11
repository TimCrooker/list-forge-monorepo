'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface ProductMockupProps {
  variant?: 'browser' | 'mobile' | 'dashboard'
  title?: string
  className?: string
  children?: ReactNode
}

export function ProductMockup({
  variant = 'browser',
  title = 'ListForge',
  className = '',
  children,
}: ProductMockupProps) {
  if (variant === 'mobile') {
    return <MobileMockup className={className}>{children}</MobileMockup>
  }

  if (variant === 'dashboard') {
    return <DashboardMockup title={title} className={className}>{children}</DashboardMockup>
  }

  return <BrowserMockup title={title} className={className}>{children}</BrowserMockup>
}

function BrowserMockup({
  title,
  className,
  children,
}: {
  title: string
  className: string
  children?: ReactNode
}) {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden border border-border/50 bg-card shadow-2xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-4">
          <div className="max-w-md mx-auto px-3 py-1 rounded-md bg-background/50 text-xs text-muted-foreground text-center truncate">
            app.listforge.io/{title.toLowerCase().replace(/\s/g, '-')}
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="aspect-[16/10] bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
        {children || <DashboardPlaceholder />}
      </div>
    </motion.div>
  )
}

function MobileMockup({
  className,
  children,
}: {
  className: string
  children?: ReactNode
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] rounded-[3rem] border-[14px] border-foreground/10 bg-card shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground/10 rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="aspect-[9/19.5] bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
          {children || <MobilePlaceholder />}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full" />
      </div>
    </motion.div>
  )
}

function DashboardMockup({
  title,
  className,
  children,
}: {
  title: string
  className: string
  children?: ReactNode
}) {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden border border-border/50 bg-card shadow-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* App header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">L</span>
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
        </div>
      </div>

      {/* Content */}
      <div className="aspect-[16/9] bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
        {children || <DashboardPlaceholder />}
      </div>
    </motion.div>
  )
}

// Placeholder content for screenshots
function DashboardPlaceholder() {
  return (
    <div className="absolute inset-0 p-4">
      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-48 border-r border-border/30 p-3">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-8 rounded-lg ${i === 1 ? 'bg-primary/20' : 'bg-muted/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="ml-52 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/30 p-3">
              <div className="w-8 h-2 bg-muted/50 rounded mb-2" />
              <div className="w-16 h-4 bg-primary/30 rounded" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg bg-muted/20 p-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded bg-muted/40" />
              <div className="flex-1 h-3 bg-muted/30 rounded" />
              <div className="w-20 h-3 bg-muted/30 rounded" />
              <div className="w-16 h-6 bg-primary/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MobilePlaceholder() {
  return (
    <div className="absolute inset-0 pt-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-20 h-4 bg-muted/40 rounded" />
        <div className="w-8 h-8 rounded-full bg-muted/40" />
      </div>

      {/* Camera capture area */}
      <div className="aspect-square rounded-2xl bg-muted/30 mb-4 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/30" />
      </div>

      {/* Product info */}
      <div className="space-y-3">
        <div className="h-4 bg-muted/40 rounded w-3/4" />
        <div className="h-3 bg-muted/30 rounded w-1/2" />
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-10 bg-primary/30 rounded-lg" />
          <div className="w-10 h-10 bg-muted/30 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
