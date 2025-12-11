'use client'

import {
  Code,
  Lock,
  Database,
  Search,
  ShoppingCart,
  Webhook,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { TiltCard } from '@/components/effects/TiltCard'
import { GridPattern } from '@/components/decorative/GridPattern'
import { HeroBackground } from '@/components/decorative/HeroBackground'
import { getSignupUrl } from '@/lib/constants'

interface EndpointCard {
  icon: typeof Database
  title: string
  description: string
  methods: string[]
  color: string
}

const endpoints: EndpointCard[] = [
  {
    icon: Database,
    title: 'Items API',
    description: 'Create, read, update, and manage your product inventory with full CRUD operations and AI capture.',
    methods: ['GET /items', 'POST /items/ai-capture', 'POST /items/manual', 'PATCH /items/:id', 'DELETE /items/:id'],
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    icon: Search,
    title: 'Research API',
    description: 'Trigger AI-powered research workflows to identify products, analyze market data, and get pricing insights.',
    methods: ['POST /items/:id/research', 'GET /research-runs/:id', 'POST /items/barcode-lookup', 'POST /items/quick-eval'],
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: ShoppingCart,
    title: 'Marketplace API',
    description: 'Connect marketplace accounts and publish listings to eBay, Amazon, and Facebook Marketplace.',
    methods: ['GET /marketplaces/accounts', 'POST /items/:id/publish', 'GET /items/:id/marketplace-listings'],
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Receive real-time notifications from marketplaces for inventory updates, order changes, and listing events.',
    methods: ['POST /marketplaces/webhooks/ebay', 'POST /marketplaces/webhooks/facebook'],
    color: 'from-orange-500/20 to-orange-600/20',
  },
]

const authFeatures = [
  'JWT Bearer Token Authentication',
  'Organization-Scoped Access Control',
  'Rate Limiting (20 req/min default)',
  'Webhook HMAC Signature Verification',
  'TLS/SSL Encryption Required',
  'Role-Based Access Control',
]

const codeExample = `// Authenticate and create an item with AI capture
const formData = new FormData()
formData.append('photos', photo1Blob, 'photo1.jpg')
formData.append('photos', photo2Blob, 'photo2.jpg')
formData.append('title', 'Vintage Camera')
formData.append('description', 'Canon AE-1 Program')

const response = await fetch('https://api.listforge.io/items/ai-capture', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'X-Organization-Id': 'org_abc123'
  },
  body: formData
})

const { item } = await response.json()

// Trigger AI research workflow
const researchResponse = await fetch(
  \`https://api.listforge.io/items/\${item.id}/research\`,
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'X-Organization-Id': 'org_abc123',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      runType: 'initial_intake'
    })
  }
)

const { researchRun } = await researchResponse.json()

// Listen for real-time updates via WebSocket
// WebSocket events: research:node-started, research:completed, etc.`

function CodeBlock() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-slate-400 text-sm ml-3">example.ts</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 text-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Code */}
        <pre className="p-6 overflow-x-auto">
          <code className="text-sm text-slate-300 font-mono leading-relaxed">
            {codeExample}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function ApiReference() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <HeroBackground />
        <GridPattern variant="dots" className="opacity-30" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Code className="h-4 w-4" />
              API Documentation
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              API Reference
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Build powerful integrations with the ListForge REST API. Automate your workflow,
              sync inventory, leverage AI-powered research, and publish to multiple marketplaces.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getSignupUrl({ source: 'api-docs' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity group"
              >
                Get API Access
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#endpoints"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border bg-background/50 backdrop-blur hover:bg-accent transition-colors"
              >
                <Code className="h-5 w-5" />
                View Endpoints
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-24 relative">
        <div className="container">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              RESTful API Architecture
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our API follows REST principles with predictable resource-oriented URLs,
              accepts JSON-encoded request bodies, and returns JSON-encoded responses.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FadeIn direction="up" delay={0.1}>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">JSON API</h3>
                <p className="text-muted-foreground text-sm">
                  All requests and responses use JSON format with consistent structure
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure by Default</h3>
                <p className="text-muted-foreground text-sm">
                  TLS encryption, API key authentication, and rate limiting included
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.3}>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
                  <Database className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
                <p className="text-muted-foreground text-sm">
                  WebSocket and webhook support for instant notifications
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section className="py-24 relative overflow-hidden">
        <GridPattern variant="lines" className="opacity-20" />

        <div className="container relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <FadeIn direction="left">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <Lock className="h-4 w-4" />
                  Authentication
                </div>

                <h2 className="text-3xl font-bold tracking-tight mb-6">
                  Secure API Access
                </h2>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                  ListForge uses JWT bearer token authentication for all API requests.
                  All requests must include a valid access token and are scoped to your organization
                  with role-based permissions enforced at the endpoint level.
                </p>

                <div className="space-y-3">
                  {authFeatures.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-2xl" />
                <div className="relative bg-card rounded-2xl border border-border p-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-mono">REQUEST</div>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300">
                        <div className="text-blue-400">GET</div>
                        <div className="mt-1">https://api.listforge.io/items</div>
                        <div className="mt-3 text-slate-500">Headers:</div>
                        <div className="text-green-400">Authorization: Bearer YOUR_JWT_TOKEN</div>
                        <div className="text-green-400">X-Organization-Id: org_abc123</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-mono">RESPONSE</div>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300">
                        <div className="text-slate-500">{'{'}</div>
                        <div className="ml-4">
                          <span className="text-blue-400">"items"</span>: [...]
                        </div>
                        <div className="ml-4">
                          <span className="text-blue-400">"total"</span>: <span className="text-yellow-400">42</span>
                        </div>
                        <div className="text-slate-500">{'}'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Endpoints Section */}
      <section id="endpoints" className="py-24">
        <div className="container">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              API Endpoints
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive endpoints for managing inventory, triggering research,
              and publishing listings across marketplaces.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {endpoints.map((endpoint) => {
              const Icon = endpoint.icon
              return (
                <StaggerItem key={endpoint.title}>
                  <TiltCard tiltAmount={5} glareEnabled className="h-full">
                    <div className="group relative h-full p-8 rounded-2xl bg-card border border-border overflow-hidden">
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${endpoint.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                      <div className="relative">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl icon-gradient mb-6 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>

                        <h3 className="text-xl font-semibold mb-3">
                          {endpoint.title}
                        </h3>

                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {endpoint.description}
                        </p>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Available Methods
                          </div>
                          {endpoint.methods.map((method) => (
                            <div
                              key={method}
                              className="font-mono text-sm py-2 px-3 rounded-lg bg-muted/50 border border-border/50"
                            >
                              {method}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-24 relative overflow-hidden">
        <GridPattern variant="dots" className="opacity-20" />

        <div className="container relative">
          <FadeIn direction="up" className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Quick Start Example
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our TypeScript SDK. Create items, trigger research,
              and manage listings with just a few lines of code.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.2} className="max-w-4xl mx-auto">
            <CodeBlock />
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <FadeIn direction="up">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 border border-primary/30 p-12 md:p-16">
              <div className="absolute inset-0 bg-grid-white/5" />

              <div className="relative text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  Ready to Build?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Create your account and start integrating ListForge into your workflow today.
                  Get access to all API endpoints with standard rate limits of 20 requests per minute.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={getSignupUrl({ source: 'api-docs-cta' })}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity group"
                  >
                    Create Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href={getSignupUrl({ source: 'api-docs' })}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border bg-background/50 backdrop-blur hover:bg-accent transition-colors"
                  >
                    <Code className="h-5 w-5" />
                    Contact for API Access
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
