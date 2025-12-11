'use client'

import { HeroCentered } from '@listforge/ui'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { getSignupUrl, scrollToSection, NAV_SECTIONS } from '@/lib/constants'
import { HeroBackground } from './decorative/HeroBackground'
import { FloatingElements } from './decorative/FloatingElements'
import { FadeIn } from './animations/FadeIn'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <HeroBackground />

      {/* Floating sparkles */}
      <FloatingElements variant="sparkles" />

      <div className="relative pt-16">
        <FadeIn direction="up" delay={0.2}>
          <HeroCentered
            announcement={{
              text: '95% Identification Accuracy - See How It Works',
              href: NAV_SECTIONS.integrations,
              icon: <Sparkles className="h-4 w-4" />,
              variant: 'badge',
            }}
            title="From Photo to Published in 45 Seconds"
            description="AI-powered product identification, evidence-based pricing, and one-click publishing to eBay, Amazon & Facebook Marketplace. Stop spending 15 minutes per listing."
            primaryCta={{
              text: 'Start Free Trial',
              href: getSignupUrl({ plan: 'pro', trial: true }),
            }}
            secondaryCta={{
              text: 'See Real Results',
              onClick: () => scrollToSection(NAV_SECTIONS.features),
            }}
            socialProof={{
              rating: 5,
              reviews: 1250,
              text: 'Trusted by 10,000+ resellers',
            }}
            size="large"
            showScrollIndicator
          />
        </FadeIn>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  )
}
