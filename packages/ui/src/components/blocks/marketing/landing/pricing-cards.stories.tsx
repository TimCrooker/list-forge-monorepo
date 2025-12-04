import type { Meta, StoryObj } from '@storybook/react'
import { PricingCards } from './pricing-cards'

const meta: Meta<typeof PricingCards> = {
  title: 'Blocks/Marketing/Landing/PricingCards',
  component: PricingCards,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PricingCards>

const sampleTiers = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small teams',
    price: {
      monthly: 29,
      yearly: 279,
      currency: '$',
    },
    features: [
      { text: 'Up to 5 team members', included: true },
      { text: '10GB storage', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'API access', included: false },
      { text: 'Custom domain', included: false },
      { text: 'Advanced security', included: false },
    ],
    cta: {
      text: 'Get started',
      href: '#',
    },
  },
  {
    name: 'Pro',
    description: 'Best for growing businesses',
    price: {
      monthly: 79,
      yearly: 759,
      currency: '$',
    },
    features: [
      { text: 'Up to 20 team members', included: true },
      { text: '50GB storage', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Advanced security', included: false },
    ],
    cta: {
      text: 'Start free trial',
      href: '#',
    },
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: {
      monthly: 299,
      yearly: 2879,
      currency: '$',
    },
    features: [
      { text: 'Unlimited team members', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'Custom analytics', included: true },
      { text: '24/7 support', included: true },
      { text: 'API access', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Advanced security', included: true },
    ],
    cta: {
      text: 'Contact sales',
      href: '#',
    },
  },
]

export const Default: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers,
  },
}

export const WithoutTitle: Story = {
  args: {
    tiers: sampleTiers,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Simple, transparent pricing',
    tiers: sampleTiers,
  },
}

export const WithoutBillingToggle: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers,
    billingPeriod: 'monthly',
  },
}

export const YearlyBilling: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers,
    billingPeriod: 'yearly',
  },
}

export const WithBillingToggle: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers,
    billingPeriod: 'monthly',
    onBillingPeriodChange: period => console.debug(`Billing period changed to ${period}`),
  },
}

export const WithoutHighlighted: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(({ highlighted, ...tier }) => tier),
  },
}

export const WithoutBadges: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(({ badge, ...tier }) => tier),
  },
}

export const CustomPricing: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: [
      {
        name: 'Starter',
        description: 'Perfect for individuals and small teams',
        price: {
          custom: 'Free',
        },
        features: [
          { text: 'Up to 5 team members', included: true },
          { text: '10GB storage', included: true },
          { text: 'Basic analytics', included: true },
          { text: 'Email support', included: true },
          { text: 'API access', included: false },
          { text: 'Custom domain', included: false },
          { text: 'Advanced security', included: false },
        ],
        cta: {
          text: 'Get started',
          href: '#',
        },
      },
      {
        name: 'Pro',
        description: 'Best for growing businesses',
        price: {
          custom: 'Contact us',
        },
        features: [
          { text: 'Up to 20 team members', included: true },
          { text: '50GB storage', included: true },
          { text: 'Advanced analytics', included: true },
          { text: 'Priority support', included: true },
          { text: 'API access', included: true },
          { text: 'Custom domain', included: true },
          { text: 'Advanced security', included: false },
        ],
        cta: {
          text: 'Contact sales',
          href: '#',
        },
        highlighted: true,
        badge: 'Most popular',
      },
      {
        name: 'Enterprise',
        description: 'For large organizations',
        price: {
          custom: 'Custom',
        },
        features: [
          { text: 'Unlimited team members', included: true },
          { text: 'Unlimited storage', included: true },
          { text: 'Custom analytics', included: true },
          { text: '24/7 support', included: true },
          { text: 'API access', included: true },
          { text: 'Custom domain', included: true },
          { text: 'Advanced security', included: true },
        ],
        cta: {
          text: 'Contact sales',
          href: '#',
        },
      },
    ],
  },
}

export const DifferentCurrency: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(tier => ({
      ...tier,
      price: {
        ...tier.price,
        currency: '€',
      },
    })),
  },
}

export const WithOnClick: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(tier => ({
      ...tier,
      cta: {
        text: tier.cta.text,
        onClick: () => alert(`Clicked ${tier.name} plan`),
      },
    })),
  },
}

export const ManyFeatures: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(tier => ({
      ...tier,
      features: [
        ...tier.features,
        { text: 'Team collaboration', included: tier.name !== 'Starter' },
        { text: 'Advanced reporting', included: tier.name !== 'Starter' },
        { text: 'Custom workflows', included: tier.name === 'Enterprise' },
        { text: 'Dedicated account manager', included: tier.name === 'Enterprise' },
        { text: 'SLA guarantee', included: tier.name === 'Enterprise' },
      ],
    })),
  },
}

export const LongDescriptions: Story = {
  args: {
    title: 'Simple, transparent pricing',
    description: "Choose the plan that's right for you",
    tiers: sampleTiers.map(tier => ({
      ...tier,
      description: `${tier.description} This plan is designed to help you scale your business and includes all the features you need to succeed.`,
    })),
  },
}
