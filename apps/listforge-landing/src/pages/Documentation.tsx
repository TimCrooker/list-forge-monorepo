'use client'

import { useState } from 'react'
import {
  BookOpen,
  Smartphone,
  Brain,
  Link2,
  TrendingUp,
  Layers,
  Search,
  ArrowRight
} from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GridPattern } from '@/components/decorative/GridPattern'
import { TiltCard } from '@/components/effects/TiltCard'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BackToTop } from '@/components/ui/BackToTop'

interface DocCard {
  icon: typeof BookOpen
  title: string
  description: string
  link: string
}

const docCards: DocCard[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Set up your account, configure settings, and create your first listing. Learn the complete item lifecycle from capture to sale.',
    link: '/help',
  },
  {
    icon: Smartphone,
    title: 'Mobile App Capture',
    description: 'Capture items anywhere with barcode scanning, photo capture, and offline support. Sync seamlessly when back online.',
    link: '/help',
  },
  {
    icon: Brain,
    title: 'AI Research & Identification',
    description: 'Automated product identification using vision AI, UPC lookups, and web search. Track confidence scores and data sources.',
    link: '/help',
  },
  {
    icon: Link2,
    title: 'Marketplace Connections',
    description: 'Connect eBay, Amazon, and other marketplace accounts. Publish listings and sync inventory across all platforms.',
    link: '/help',
  },
  {
    icon: TrendingUp,
    title: 'Pricing & Comparables',
    description: 'AI-powered pricing analysis using sold comps, current market trends, and competitor data. Maximize your profit margins.',
    link: '/help',
  },
  {
    icon: Layers,
    title: 'Bulk Operations',
    description: 'Process inventory at scale with bulk imports, batch editing, multi-platform publishing, and automated research workflows.',
    link: '/help',
  },
]

export function Documentation() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCards = searchQuery
    ? docCards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : docCards

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <GridPattern variant="dots" className="opacity-40" />

          <div className="container relative">
            <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Documentation
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Everything you need to get started with ListForge
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Documentation Cards */}
        <section className="relative py-16 md:py-24">
          <div className="container">
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCards.map((card) => {
                const Icon = card.icon
                return (
                  <StaggerItem key={card.title}>
                    <TiltCard tiltAmount={8} glareEnabled className="h-full">
                      <a
                        href={card.link}
                        className="group relative h-full p-8 rounded-2xl bg-card border border-border/50 overflow-hidden block transition-all duration-300 hover:border-primary/50"
                      >
                        {/* Hover gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative">
                          {/* Icon */}
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl icon-gradient mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-7 w-7 text-primary" />
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                            {card.title}
                          </h3>

                          {/* Description */}
                          <p className="text-muted-foreground leading-relaxed mb-6">
                            {card.description}
                          </p>

                          {/* Read More Link */}
                          <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                            Read More
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </a>
                    </TiltCard>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>

            {/* No results message */}
            {filteredCards.length === 0 && (
              <FadeIn direction="up" className="text-center py-16">
                <p className="text-lg text-muted-foreground">
                  No documentation found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-primary hover:underline"
                >
                  Clear search
                </button>
              </FadeIn>
            )}
          </div>
        </section>

        {/* Help Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <GridPattern variant="lines" className="opacity-30" />

          <div className="container relative">
            <FadeIn direction="up" className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Need More Help?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Can't find what you're looking for? Our support team is here to help you succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@listforge.io"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium shadow hover:bg-primary/90 transition-colors glow-primary-hover"
                >
                  Contact Support
                </a>
                <a
                  href="/help"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-accent transition-colors"
                >
                  Browse Help Center
                </a>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
