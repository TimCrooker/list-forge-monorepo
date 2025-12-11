'use client'

import { motion } from 'framer-motion'
import {
  Globe,
  DollarSign,
  TrendingUp,
  Calendar,
  Heart,
  GraduationCap,
  Laptop,
  Users,
  Briefcase,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { FadeIn } from '../components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer'
import { GridPattern } from '../components/decorative/GridPattern'
import { GlowEffect } from '../components/decorative/GlowEffect'
import { TiltCard } from '../components/effects/TiltCard'
import { benefits, openPositions } from '../data/careers'
import { cn } from '../lib/utils'

const iconMap = {
  Globe,
  DollarSign,
  TrendingUp,
  Calendar,
  Heart,
  GraduationCap,
  Laptop,
  Users,
}

export function Careers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <GridPattern variant="dots" className="opacity-30" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">We're Hiring!</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Join the ListForge Team
            </h1>
            <p className="text-xl text-muted-foreground">
              Help us build the future of reselling. We're looking for talented, passionate people to join our remote-first team.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Company Culture Section */}
      <section className="relative py-20 bg-muted/30">
        <div className="container">
          <FadeIn direction="up" className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-center">
              About ListForge
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                We're a small, focused team building the future of reselling. Our mission is to empower resellers with AI-powered tools that make listing faster, smarter, and more profitable.
              </p>
              <p>
                As an early-stage startup, every team member has significant impact. You'll work directly with founders, ship features that users love, and help shape our product and culture from the ground up.
              </p>
              <p>
                We value ownership, clear communication, and continuous learning. We move fast but thoughtfully, prioritize user feedback, and believe the best solutions come from diverse perspectives working together.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Why Work Here Section */}
      <section className="relative py-20">
        <div className="container">
          <FadeIn direction="up" className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Benefits & Perks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We offer competitive benefits designed to support your growth, health, and work-life balance.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => {
              const Icon = iconMap[benefit.icon as keyof typeof iconMap]

              return (
                <StaggerItem key={benefit.title}>
                  <TiltCard tiltAmount={5} className="h-full">
                    <div className="relative h-full flex flex-col p-6 rounded-2xl border bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                      <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </TiltCard>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="relative py-20 overflow-hidden">
        <GridPattern variant="lines" className="opacity-20" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your next opportunity. All positions are remote and full-time.
            </p>
          </FadeIn>

          <StaggerContainer className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((job) => (
              <StaggerItem key={job.id}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="relative group"
                >
                  <div className="relative p-6 rounded-2xl border bg-card border-border/50 hover:border-primary/50 transition-all">
                    <GlowEffect
                      intensity="soft"
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                            {job.type}
                          </span>
                        </div>
                      </div>

                      <motion.a
                        href={`mailto:careers@listforge.io?subject=Application: ${job.title}`}
                        whileHover={{ x: 4 }}
                        className={cn(
                          'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                          'bg-primary text-primary-foreground hover:bg-primary/90',
                          'transition-colors whitespace-nowrap'
                        )}
                      >
                        Apply Now
                        <ArrowRight className="h-4 w-4" />
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* No position? */}
          <FadeIn direction="up" delay={0.6} className="text-center mt-12">
            <div className="max-w-2xl mx-auto p-8 rounded-2xl border bg-card/50 border-border/50">
              <h3 className="text-xl font-semibold mb-3">
                Don't see the right role?
              </h3>
              <p className="text-muted-foreground mb-4">
                We're always looking for exceptional talent. Send us your resume and tell us why you'd be a great fit for ListForge.
              </p>
              <motion.a
                href="mailto:careers@listforge.io?subject=General Application"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border bg-background hover:bg-muted transition-colors font-medium"
              >
                Get in Touch
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
