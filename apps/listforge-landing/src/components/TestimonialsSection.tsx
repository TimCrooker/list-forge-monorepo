'use client'

import { testimonials } from '@/data/testimonials'
import { FadeIn } from './animations/FadeIn'
import { StaggerContainer, StaggerItem } from './animations/StaggerContainer'
import { GradientOrbs } from './decorative/GradientOrbs'
import { TiltCard } from './effects/TiltCard'
import { Star, Quote, TrendingUp } from 'lucide-react'

export function TestimonialsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <GradientOrbs variant="scattered" className="opacity-20" />

      <div className="container relative">
        <FadeIn direction="up" className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by resellers everywhere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about transforming their business with ListForge
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.author.name}>
              <TiltCard tiltAmount={5} glareEnabled className="h-full">
                <div className="group relative h-full p-6 rounded-2xl bg-card border border-border/50">
                  {/* Quote icon */}
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

                  <div className="relative space-y-4">
                    {/* Highlight badge */}
                    {testimonial.highlight && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {testimonial.highlight}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-muted-foreground leading-relaxed text-sm">
                      "{testimonial.content}"
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-teal-400/20 flex items-center justify-center text-primary font-semibold text-sm">
                        {testimonial.author.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.author.role} · {testimonial.author.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
