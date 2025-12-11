'use client'

import { showcaseFeatures } from '@/data/features'
import { FadeIn } from './animations/FadeIn'
import { WavesDivider } from './decorative/WavesDivider'
import { ProductMockup } from './effects/ProductMockup'
import { CheckCircle2 } from 'lucide-react'

export function FeatureShowcase() {
  return (
    <section className="relative py-24 bg-muted/30">
      {/* Top wave */}
      <WavesDivider position="top" className="text-background" />

      <div className="container">
        <FadeIn direction="up" className="text-center mb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See how it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From capture to sale in three simple steps
          </p>
        </FadeIn>

        <div className="space-y-32">
          {showcaseFeatures.map((feature, index) => {
            const Icon = feature.icon
            const isReversed = index % 2 === 1
            // Alternate mockup types
            const mockupVariant = index === 0 ? 'mobile' : index === 1 ? 'dashboard' : 'browser'

            return (
              <div
                key={feature.title}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-16 items-center`}
              >
                {/* Content */}
                <FadeIn
                  direction={isReversed ? 'right' : 'left'}
                  className="flex-1 space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {feature.badge}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold">{feature.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </FadeIn>

                {/* Product mockup */}
                <FadeIn
                  direction={isReversed ? 'left' : 'right'}
                  delay={0.2}
                  className="flex-1 w-full"
                >
                  <div className="relative group">
                    {/* Glow effect behind mockup */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-teal-400/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />

                    <ProductMockup
                      variant={mockupVariant}
                      title={feature.badge}
                      className="relative"
                    />
                  </div>
                </FadeIn>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom wave */}
      <WavesDivider position="bottom" className="text-background" />
    </section>
  )
}
