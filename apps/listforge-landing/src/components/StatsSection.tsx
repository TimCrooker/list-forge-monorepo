'use client'

import { Sparkles, Globe, Clock, TrendingUp, type LucideIcon } from 'lucide-react'
import { FadeIn } from './animations/FadeIn'
import { StaggerContainer, StaggerItem } from './animations/StaggerContainer'
import { CountUp } from './animations/CountUp'
import { GradientOrbs } from './decorative/GradientOrbs'
import { TiltCard } from './effects/TiltCard'

interface StatItem {
  label: string
  value: number
  prefix?: string
  suffix?: string
  description: string
  icon: LucideIcon
}

const stats: StatItem[] = [
  {
    label: 'Identification Accuracy',
    value: 95,
    suffix: '%',
    description: 'AI correctly identifies products',
    icon: Sparkles,
  },
  {
    label: 'Average Time Saved',
    value: 14,
    suffix: ' min',
    description: 'Per listing vs manual research',
    icon: Clock,
  },
  {
    label: 'Marketplaces Supported',
    value: 3,
    suffix: '',
    description: 'eBay, Amazon, Facebook Marketplace',
    icon: Globe,
  },
  {
    label: 'Time to List',
    value: 45,
    suffix: ' sec',
    description: 'From photo to published listing',
    icon: TrendingUp,
  },
]

export function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <GradientOrbs variant="subtle" className="opacity-30" />

      <div className="container relative">
        <FadeIn direction="up" className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by thousands of resellers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a growing community of sellers who are scaling their business with ListForge
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <StaggerItem key={stat.label}>
                <TiltCard tiltAmount={10} glareEnabled className="h-full">
                  <div className="text-center group p-6 rounded-xl bg-card/50 border border-border/50 h-full">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl icon-gradient mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {stat.prefix}
                      <CountUp
                        end={stat.value}
                        decimals={stat.value % 1 !== 0 ? 1 : 0}
                        duration={2.5}
                        delay={index * 0.1}
                      />
                      {stat.suffix}
                    </div>
                    <div className="font-medium text-foreground mb-1">{stat.label}</div>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
