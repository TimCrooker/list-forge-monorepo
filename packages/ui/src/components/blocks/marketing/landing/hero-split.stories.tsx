import type { Meta, StoryObj } from '@storybook/react'
import { HeroSplit } from './hero-split'
import { Rocket } from 'lucide-react'

const meta: Meta<typeof HeroSplit> = {
  title: 'Blocks/Marketing/Landing/HeroSplit',
  component: HeroSplit,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof HeroSplit>

const sampleFeatures = ['Built for developers', 'Enterprise-ready', '24/7 support', '99.9% uptime']

const sampleStats = [
  {
    value: '10K+',
    label: 'Active users',
  },
  {
    value: '99.9%',
    label: 'Uptime',
  },
  {
    value: '24/7',
    label: 'Support',
  },
]

export const Default: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    imagePosition: 'right',
    stats: sampleStats,
  },
}

export const LeftImage: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    imagePosition: 'left',
    stats: sampleStats,
  },
}

export const WithoutBadge: Story = {
  args: {
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const WithoutFeatures: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const WithoutStats: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
  },
}

export const PrimaryOnly: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const SecondaryOnly: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const WithOnClick: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      onClick: () => alert('Primary CTA clicked!'),
    },
    secondaryCta: {
      text: 'Learn More',
      onClick: () => alert('Secondary CTA clicked!'),
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const LongTitle: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title:
      'Transform your development workflow with our powerful platform that helps you build better products faster than ever before',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const LongDescription: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      "Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools. We provide everything you need to succeed in today's fast-paced development environment, from powerful APIs to comprehensive documentation and dedicated support.",
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const ManyFeatures: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: [
      ...sampleFeatures,
      'Advanced analytics',
      'Custom integrations',
      'Team collaboration',
      'Automated workflows',
    ],
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: sampleStats,
  },
}

export const ManyStats: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    stats: [
      ...sampleStats,
      {
        value: '50+',
        label: 'Integrations',
      },
      {
        value: '100+',
        label: 'Features',
      },
    ],
  },
}

export const WithBackgroundImage: Story = {
  args: {
    badge: {
      text: 'New Platform',
      icon: <Rocket className="h-3 w-3" />,
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    features: sampleFeatures,
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    image: {
      src: 'https://placehold.co/800x600/2563eb/ffffff?text=Hero+Image',
      alt: 'Platform screenshot',
    },
    imagePosition: 'right',
    stats: sampleStats,
    backgroundImage: {
      src: '/images/vectors/hero-background.svg',
      alt: 'Vector background with geometric patterns',
      opacity: 0.7,
    },
  },
}
