import { getSignupUrl } from '@/lib/constants'

export interface PricingFeature {
  text: string
  included: boolean
}

export interface PricingTier {
  name: string
  description: string
  price: {
    monthly: number | string
    yearly: number | string
    custom?: string
  }
  features: PricingFeature[]
  cta: {
    text: string
    href: string
  }
  highlighted?: boolean
  badge?: string
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for testing the waters with AI-powered listing',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: 'Up to 50 items per month', included: true },
      { text: 'Visual AI identification', included: true },
      { text: 'OCR for UPC/EAN/Serial extraction', included: true },
      { text: 'Per-field confidence tracking', included: true },
      { text: 'eBay integration', included: true },
      { text: 'Mobile app (offline-first)', included: true },
      { text: 'Price bands with comparables', included: false },
      { text: 'Amazon & Facebook integrations', included: false },
      { text: 'Bulk operations', included: false },
    ],
    cta: {
      text: 'Get Started Free',
      href: getSignupUrl({ plan: 'starter' }),
    },
  },
  {
    name: 'Pro',
    description: 'For serious resellers ready to scale',
    price: {
      monthly: 29,
      yearly: 290,
    },
    features: [
      { text: 'Up to 500 items per month', included: true },
      { text: 'Full visual AI + multi-source research', included: true },
      { text: 'Price bands: floor/target/ceiling', included: true },
      { text: 'Demand signals & sell-through rates', included: true },
      { text: 'eBay, Amazon & Facebook integrations', included: true },
      { text: 'SEO-optimized listing generation', included: true },
      { text: 'Evidence-based research tracking', included: true },
      { text: 'Bulk operations & batch processing', included: true },
      { text: 'Mobile app with offline mode', included: true },
    ],
    cta: {
      text: 'Start Free Trial',
      href: getSignupUrl({ plan: 'pro', trial: true }),
    },
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    description: 'For teams and high-volume operations',
    price: {
      monthly: 99,
      yearly: 990,
    },
    features: [
      { text: 'Unlimited items', included: true },
      { text: 'Advanced AI research + evidence tracking', included: true },
      { text: 'Amazon BSR & competition analysis', included: true },
      { text: 'Advanced pricing strategies', included: true },
      { text: 'All marketplace integrations', included: true },
      { text: 'Multi-user team access (up to 10 users)', included: true },
      { text: 'Role-based permissions', included: true },
      { text: 'Priority support & dedicated onboarding', included: true },
    ],
    cta: {
      text: 'Start Free Trial',
      href: getSignupUrl({ plan: 'business', trial: true }),
    },
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for warehouse operations',
    price: {
      monthly: 0,
      yearly: 0,
      custom: 'Custom',
    },
    features: [
      { text: 'Unlimited items & users', included: true },
      { text: 'Custom AI model fine-tuning', included: true },
      { text: 'Custom marketplace integrations', included: true },
      { text: 'Advanced webhooks & real-time events', included: true },
      { text: 'White-label options available', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SLA guarantees (99.9% uptime)', included: true },
      { text: '24/7 priority support', included: true },
    ],
    cta: {
      text: 'Contact Sales',
      href: 'mailto:sales@listforge.io?subject=Enterprise%20Inquiry',
    },
  },
]
