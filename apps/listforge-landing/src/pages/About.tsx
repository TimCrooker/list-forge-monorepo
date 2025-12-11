'use client'

import { Heart, Lightbulb, Users, Shield, Target, Rocket } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { TiltCard } from '@/components/effects/TiltCard'
import { getSignupUrl } from '@/lib/constants'

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We push the boundaries of AI to solve real problems for resellers, constantly evolving our platform with cutting-edge technology.',
  },
  {
    icon: Target,
    title: 'Simplicity',
    description: 'Complex workflows made simple. We believe powerful tools should be intuitive and easy to use, not overwhelming.',
  },
  {
    icon: Heart,
    title: 'Customer-First',
    description: 'Every feature we build starts with listening to our community. Your success is our success.',
  },
  {
    icon: Shield,
    title: 'Transparency',
    description: 'Clear pricing, honest communication, and reliable service. No hidden fees, no surprises.',
  },
]

const team = [
  {
    name: 'Sarah Chen',
    role: 'Co-Founder & CEO',
    bio: 'Former eBay power seller who sold over $2M in inventory before founding ListForge.',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Co-Founder & CTO',
    bio: 'AI/ML engineer from Amazon who saw the potential to revolutionize e-commerce listing.',
  },
  {
    name: 'Emily Johnson',
    role: 'Head of Product',
    bio: '10+ years in marketplace technology, passionate about seller experience.',
  },
  {
    name: 'David Kim',
    role: 'Lead AI Engineer',
    bio: 'PhD in Computer Vision, specializing in product identification and pricing algorithms.',
  },
]

export function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <GradientOrbs variant="hero" className="opacity-40" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
              Empowering Resellers to{' '}
              <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                Scale Their Business
              </span>{' '}
              with AI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're on a mission to eliminate the tedious parts of reselling so you can focus on what matters:
              finding great products and making sales.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="relative py-24 overflow-hidden">
        <GradientOrbs variant="section" className="opacity-20" />

        <div className="container relative">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeIn direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-teal-400/20 rounded-2xl blur-2xl" />
                <div className="relative bg-card border rounded-2xl p-8">
                  <Rocket className="h-12 w-12 text-primary mb-6" />
                  <h2 className="text-3xl font-bold mb-4">Our Story</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      ListForge was born from frustration. As active resellers ourselves, we spent countless
                      hours researching products, checking comps, writing descriptions, and manually entering
                      listing details across multiple marketplaces.
                    </p>
                    <p>
                      We knew there had to be a better way. With backgrounds in AI, e-commerce, and marketplace
                      technology, we set out to build the tool we wished we had—one that could handle the tedious
                      work while we focused on sourcing and strategy.
                    </p>
                    <p>
                      Today, ListForge powers over 10,000 resellers, from weekend flippers to full-time
                      businesses processing hundreds of items daily. We're built by resellers, for resellers.
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="left" delay={0.2}>
              <div className="space-y-8">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-teal-400/20 to-primary/20 rounded-2xl blur-2xl" />
                  <div className="relative bg-card border rounded-2xl p-8">
                    <Target className="h-12 w-12 text-primary mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To eliminate the tedious parts of reselling so sellers can focus on what matters:
                      finding great products and making sales. We believe AI should handle the grunt work—research,
                      pricing, listing creation—while you focus on growing your business.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TiltCard className="bg-card border rounded-xl p-6">
                    <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Resellers</div>
                  </TiltCard>
                  <TiltCard className="bg-card border rounded-xl p-6">
                    <div className="text-4xl font-bold text-primary mb-2">1M+</div>
                    <div className="text-sm text-muted-foreground">Items Listed</div>
                  </TiltCard>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container relative">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <StaggerItem key={value.title}>
                  <TiltCard className="h-full">
                    <div className="h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl icon-gradient mb-6 group-hover:scale-110 transition-transform">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </TiltCard>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-24 overflow-hidden">
        <GradientOrbs variant="scattered" className="opacity-20" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The people building the future of reselling
            </p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <TiltCard className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors text-center group">
                    {/* Placeholder avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-teal-400 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <GradientOrbs variant="centered" className="opacity-30" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Reselling Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of sellers who are scaling faster with AI-powered listings
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getSignupUrl({ plan: 'pro', trial: true })}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors glow-primary-hover"
              >
                Start Free Trial
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-4 text-lg font-medium hover:bg-accent transition-colors"
              >
                View Features
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
