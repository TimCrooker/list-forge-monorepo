'use client'

import { getSignupUrl } from '@/lib/constants'
import { FadeIn } from './animations/FadeIn'
import { GradientOrbs } from './decorative/GradientOrbs'
import { FloatingElements } from './decorative/FloatingElements'
import { ButtonGlow } from './decorative/GlowEffect'
import { Magnetic } from './effects/CursorGlow'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 animated-gradient" />
      <GradientOrbs variant="centered" className="opacity-40" />
      <FloatingElements variant="particles" />

      <div className="container relative">
        <FadeIn direction="up">
          <div className="relative max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">No credit card required</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Stop spending 15 minutes per listing.{' '}
              <span className="gradient-text">Start listing in 45 seconds.</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of resellers using AI-powered identification, evidence-based pricing, and one-click multi-marketplace publishing.
              Start your free trial today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Magnetic strength={0.3}>
                <ButtonGlow>
                  <a
                    href={getSignupUrl({ plan: 'pro', trial: true })}
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </ButtonGlow>
              </Magnetic>

              <Magnetic strength={0.2}>
                <a
                  href="mailto:sales@listforge.io?subject=Demo%20Request"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-background/80 backdrop-blur border border-border rounded-xl font-semibold hover:bg-background transition-all"
                >
                  Schedule a Demo
                </a>
              </Magnetic>
            </div>

            {/* Trust indicators */}
            <FadeIn direction="up" delay={0.2}>
              <div className="mt-12 pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-4">Trusted by resellers worldwide</p>
                <div className="flex items-center justify-center gap-8 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">10K+</div>
                    <div className="text-xs">Active Resellers</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">1M+</div>
                    <div className="text-xs">Items Listed</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">4.9/5</div>
                    <div className="text-xs">User Rating</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
