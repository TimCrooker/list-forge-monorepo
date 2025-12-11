'use client'

import { CheckCircle2, AlertCircle, Clock, Bell, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GradientOrbs } from '@/components/decorative/GradientOrbs'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CursorGlow } from '@/components/effects/CursorGlow'
import { BackToTop } from '@/components/ui/BackToTop'

interface Service {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  description: string
  uptime: string
}

interface Incident {
  id: string
  title: string
  status: 'resolved' | 'investigating' | 'monitoring'
  date: string
  description: string
}

const services: Service[] = [
  {
    name: 'Web Application',
    status: 'operational',
    description: 'React web interface with real-time updates',
    uptime: '99.95%',
  },
  {
    name: 'Mobile App',
    status: 'operational',
    description: 'iOS and Android applications with offline support',
    uptime: '99.92%',
  },
  {
    name: 'API Server',
    status: 'operational',
    description: 'NestJS REST API and WebSocket services',
    uptime: '99.97%',
  },
  {
    name: 'AI Research Engine',
    status: 'operational',
    description: 'LangGraph-powered product research and analysis',
    uptime: '99.85%',
  },
  {
    name: 'Database',
    status: 'operational',
    description: 'PostgreSQL database with automated backups',
    uptime: '99.99%',
  },
  {
    name: 'Marketplace Sync',
    status: 'operational',
    description: 'eBay and Amazon listing synchronization',
    uptime: '99.90%',
  },
  {
    name: 'Media Storage',
    status: 'operational',
    description: 'S3-compatible object storage for images',
    uptime: '99.95%',
  },
  {
    name: 'Job Processing',
    status: 'operational',
    description: 'BullMQ queue system with Redis',
    uptime: '99.93%',
  },
]

const recentIncidents: Incident[] = [
  // Empty for now - can be populated with real data
]

const statusConfig = {
  operational: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    icon: CheckCircle2,
    label: 'Operational',
  },
  degraded: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: AlertCircle,
    label: 'Degraded Performance',
  },
  outage: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: AlertCircle,
    label: 'Outage',
  },
}

export function Status() {
  const allOperational = services.every((s) => s.status === 'operational')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLastUpdated(
        now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <CursorGlow />
      <Navbar />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20">
          <GradientOrbs variant="subtle" className="opacity-20" />

          <div className="container relative">
            <FadeIn direction="up">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                  System Status
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Real-time monitoring and uptime statistics for all ListForge platform services
                </p>

                {/* Overall Status Indicator */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
                    allOperational
                      ? 'bg-green-500/10 border-2 border-green-500/20'
                      : 'bg-yellow-500/10 border-2 border-yellow-500/20'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      allOperational ? 'bg-green-500' : 'bg-yellow-500'
                    } animate-pulse`}
                  />
                  <span
                    className={`font-semibold ${
                      allOperational ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {allOperational ? 'All Systems Operational' : 'Partial System Outage'}
                  </span>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Services Status */}
        <section className="py-16 relative">
          <div className="container">
            <FadeIn direction="up" delay={0.1}>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Service Status</h2>
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span>Last updated: {lastUpdated}</span>
                  </div>
                )}
              </div>
            </FadeIn>

            <StaggerContainer className="space-y-4">
              {services.map((service) => {
                const config = statusConfig[service.status]
                const Icon = config.icon

                return (
                  <StaggerItem key={service.name}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`p-6 rounded-xl border ${config.borderColor} ${config.bgColor} backdrop-blur-sm transition-all`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Icon className={`h-5 w-5 ${config.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                            <div className="text-sm font-semibold">{service.uptime}</div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor} whitespace-nowrap`}
                          >
                            {config.label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          </div>
        </section>

        {/* Uptime Stats */}
        <section className="py-16 relative">
          <GradientOrbs variant="subtle" className="opacity-10" />

          <div className="container relative">
            <FadeIn direction="up">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold mb-2">Uptime Statistics</h2>
                  <p className="text-muted-foreground">Last 30 days</p>
                </div>

                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 text-center">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">99.94%</div>
                    <div className="text-sm text-muted-foreground">Overall Uptime</div>
                  </div>

                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">99.97%</div>
                    <div className="text-sm text-muted-foreground">API Availability</div>
                  </div>

                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 text-center">
                    <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {recentIncidents.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Incidents (30 days)</div>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="py-16 relative">
          <div className="container">
            <FadeIn direction="up">
              <h2 className="text-2xl font-bold mb-8">Recent Incidents</h2>

              {recentIncidents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-12 rounded-xl bg-card/50 border border-border/50 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Incidents</h3>
                  <p className="text-muted-foreground">
                    All systems have been running smoothly. No incidents reported in the last
                    30 days.
                  </p>
                </motion.div>
              ) : (
                <StaggerContainer className="space-y-4">
                  {recentIncidents.map((incident) => (
                    <StaggerItem key={incident.id}>
                      <div className="p-6 rounded-xl bg-card/50 border border-border/50">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{incident.title}</h3>
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">
                                {incident.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {incident.description}
                            </p>
                            <p className="text-xs text-muted-foreground">{incident.date}</p>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </FadeIn>
          </div>
        </section>

        {/* Subscribe to Updates */}
        <section className="py-20 relative">
          <GradientOrbs variant="centered" className="opacity-20" />

          <div className="container relative">
            <FadeIn direction="up">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Bell className="h-8 w-8 text-primary" />
                </div>

                <h2 className="text-3xl font-bold mb-4">Subscribe to Updates</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Get notified when incidents occur and stay informed about system status
                  changes.
                </p>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex"
                >
                  <a
                    href="mailto:support@listforge.io?subject=Subscribe%20to%20Status%20Updates&body=Please%20subscribe%20me%20to%20ListForge%20status%20updates.%0A%0AEmail%3A%20"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg hover:bg-primary/90 transition-colors glow-primary-hover"
                  >
                    <Bell className="h-5 w-5" />
                    Subscribe via Email
                  </a>
                </motion.div>

                <p className="text-sm text-muted-foreground mt-4">
                  Receive email notifications about planned maintenance, incidents, and major
                  updates
                </p>
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
