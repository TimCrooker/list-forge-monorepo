import type { Meta, StoryObj } from '@storybook/react'
import { CTASimple } from './cta-simple'

const meta: Meta<typeof CTASimple> = {
  title: 'Blocks/Marketing/Landing/CTASimple',
  component: CTASimple,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CTASimple>

export const Default: Story = {
  args: {
    title: 'Ready to get started?',
    description: 'Join thousands of satisfied customers who trust our platform',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    variant: 'default',
  },
}

export const Gradient: Story = {
  args: {
    title: 'Transform your workflow today',
    description: 'Experience the power of our platform with a free trial',
    primaryCta: {
      text: 'Start Free Trial',
      href: '#',
    },
    secondaryCta: {
      text: 'Contact Sales',
      href: '#',
    },
    variant: 'gradient',
  },
}

export const Subtle: Story = {
  args: {
    title: 'Stay updated with our newsletter',
    description: 'Get the latest news and updates delivered to your inbox',
    primaryCta: {
      text: 'Subscribe',
      href: '#',
    },
    secondaryCta: {
      text: 'No thanks',
      href: '#',
    },
    variant: 'subtle',
  },
}

export const PrimaryOnly: Story = {
  args: {
    title: 'Ready to get started?',
    description: 'Join thousands of satisfied customers who trust our platform',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    variant: 'default',
  },
}

export const SecondaryOnly: Story = {
  args: {
    title: 'Want to learn more?',
    description: 'Discover how our platform can help your business grow',
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    variant: 'default',
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Ready to get started?',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    variant: 'default',
  },
}

export const WithOnClick: Story = {
  args: {
    title: 'Ready to get started?',
    description: 'Join thousands of satisfied customers who trust our platform',
    primaryCta: {
      text: 'Get Started',
      onClick: () => alert('Primary CTA clicked!'),
    },
    secondaryCta: {
      text: 'Learn More',
      onClick: () => alert('Secondary CTA clicked!'),
    },
    variant: 'default',
  },
}

export const LongTitle: Story = {
  args: {
    title:
      'Ready to transform your business with our innovative platform that helps you achieve your goals faster?',
    description: 'Join thousands of satisfied customers who trust our platform',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    variant: 'default',
  },
}

export const LongDescription: Story = {
  args: {
    title: 'Ready to get started?',
    description:
      'Join thousands of satisfied customers who trust our platform. Our innovative solutions help businesses of all sizes achieve their goals faster and more efficiently than ever before.',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    variant: 'default',
  },
}
