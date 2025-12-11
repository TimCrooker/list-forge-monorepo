'use client'

import { features } from '@/data/features'
import { FadeIn } from './animations/FadeIn'
import { StaggerContainer, StaggerItem } from './animations/StaggerContainer'
import { GridPattern } from './decorative/GridPattern'
import { TiltCard } from './effects/TiltCard'

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background pattern */}
      <GridPattern variant="dots" className="opacity-40" />

      <div className="container relative">
        <FadeIn direction="up" className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to list smarter
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to help you research, price, and list products faster than ever before
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <StaggerItem key={feature.title}>
                <TiltCard tiltAmount={8} glareEnabled className="h-full">
                  <div className="group relative h-full p-6 rounded-2xl bg-card border border-border/50 overflow-hidden">
                    {/* Hover gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl icon-gradient mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
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
