import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Stat {
  label: string
  value: string | number
  suffix?: string
  prefix?: string
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export interface StatsSimpleProps {
  title?: string
  description?: string
  stats: Stat[]
  columns?: 2 | 3 | 4
}

export const StatsSimple = ({ title, description, stats, columns = 4 }: StatsSimpleProps) => {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        {(title || description) && (
          <div className="mx-auto max-w-2xl text-center mb-16">
            {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
          </div>
        )}

        {/* Stats Grid */}
        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {stats.map((stat, i) => {
            const Icon = stat.icon

            return (
              <div key={i} className="text-center">
                {Icon && (
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}

                <div className="text-4xl font-bold tracking-tight">
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </div>

                <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>

                {stat.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{stat.description}</p>
                )}

                {stat.trend && (
                  <div
                    className={cn(
                      'mt-2 inline-flex items-center gap-1 text-sm font-medium',
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    <span>{stat.trend.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(stat.trend.value)}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
