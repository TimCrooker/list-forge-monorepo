'use client'

import { useState } from 'react'
import { pricingTiers } from '@/data/pricing'
import { FadeIn } from './animations/FadeIn'
import { StaggerContainer, StaggerItem } from './animations/StaggerContainer'
import { GridPattern } from './decorative/GridPattern'
import { GlowEffect } from './decorative/GlowEffect'
import { TiltCard } from './effects/TiltCard'
import { Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background pattern */}
      <GridPattern variant="lines" className="opacity-30" />

      <div className="container relative">
        <FadeIn direction="up" className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </FadeIn>

        {/* Billing toggle */}
        <FadeIn direction="up" delay={0.1} className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                billingPeriod === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                Save 16%
              </span>
            </button>
          </div>
        </FadeIn>

        {/* Pricing cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier) => {
            const price = billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly
            const displayPrice = tier.price.custom || (typeof price === 'number' ? (price === 0 ? 'Free' : `$${price}`) : price)
            const period = tier.price.custom ? null : billingPeriod === 'yearly' ? '/year' : '/mo'

            return (
              <StaggerItem key={tier.name}>
                <TiltCard tiltAmount={tier.highlighted ? 5 : 8} glareEnabled className="h-full">
                  <div
                    className={cn(
                      'relative h-full flex flex-col p-6 rounded-2xl border transition-all',
                      tier.highlighted
                        ? 'bg-card border-primary shadow-lg'
                        : 'bg-card/50 border-border/50'
                    )}
                  >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {tier.badge}
                    </div>
                  )}

                  {/* Glow effect for highlighted */}
                  {tier.highlighted && (
                    <GlowEffect intensity="medium" className="absolute inset-0 rounded-2xl" />
                  )}

                  <div className="relative">
                    {/* Header */}
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>

                    {/* Price */}
                    <div className="mt-6 mb-6">
                      <span className="text-4xl font-bold">{displayPrice}</span>
                      {period && <span className="text-muted-foreground">{period}</span>}
                    </div>

                    {/* CTA */}
                    <a
                      href={tier.cta.href}
                      className={cn(
                        'block w-full text-center py-3 px-4 rounded-lg font-medium transition-all',
                        tier.highlighted
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      )}
                    >
                      {tier.cta.text}
                    </a>

                    {/* Features */}
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={feature.included ? 'text-muted-foreground' : 'text-muted-foreground/50'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
