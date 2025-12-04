import type { Meta, StoryObj } from '@storybook/react'
import { HeroCentered } from './hero-centered'

const meta: Meta<typeof HeroCentered> = {
  title: 'Blocks/Marketing/Landing/HeroCentered',
  component: HeroCentered,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof HeroCentered>

const sampleAvatars = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
]

export const Default: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
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
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const WithoutAnnouncement: Story = {
  args: {
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
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const WithoutSocialProof: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
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
  },
}

export const PrimaryOnly: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const SecondaryOnly: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const WithOnClick: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
    },
    title: 'Build better products faster',
    description:
      'Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools.',
    primaryCta: {
      text: 'Get Started',
      onClick: () => alert('Primary CTA clicked!'),
    },
    secondaryCta: {
      text: 'Learn More',
      onClick: () => alert('Secondary CTA clicked!'),
    },
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const RatingOnly: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
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
    socialProof: {
      rating: 4.8,
      reviews: 1234,
    },
  },
}

export const AvatarsOnly: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
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
    socialProof: {
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const TextOnly: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
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
    socialProof: {
      text: 'Trusted by developers worldwide',
    },
  },
}

export const LongTitle: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
    },
    title:
      'Transform your development workflow with our powerful platform that helps you build better products faster than ever before',
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
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const LongDescription: Story = {
  args: {
    announcement: {
      text: 'New features available',
      href: '#',
    },
    title: 'Build better products faster',
    description:
      "Our platform helps you build, ship, and scale your products with confidence. Join thousands of developers who trust our tools. We provide everything you need to succeed in today's fast-paced development environment, from powerful APIs to comprehensive documentation and dedicated support.",
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      avatars: sampleAvatars,
      text: 'Trusted by developers worldwide',
    },
  },
}

export const WithBackgroundImage: Story = {
  args: {
    announcement: {
      text: 'Announcing our new Broker Portal',
      icon: '✨',
      variant: 'pill',
    },
    title: 'Revolutionizing Wholesale Lending Workflows',
    description:
      'A full-stack platform purpose-built for Encompass lenders. Transform your operations with intelligent automation, seamless integrations, and broker-obsessed experiences.',
    primaryCta: {
      text: 'Request a Demo',
      href: '#',
    },
    secondaryCta: {
      text: 'Watch 2-Minute Tour',
    },
    socialProof: {
      rating: 4.9,
      reviews: 150,
      text: 'Trusted by leading wholesale lenders nationwide',
    },
    backgroundImage: {
      src: '/images/vectors/hero-background.svg',
      alt: 'Vector background graphics',
      opacity: 0.8,
    },
    size: 'large',
    showScrollIndicator: true,
  },
}

export const LargeSize: Story = {
  args: {
    announcement: {
      text: '🚀 Now in beta',
      variant: 'pill',
    },
    title: 'Build the future with our platform',
    description:
      'Experience the next generation of development tools with enhanced performance, better developer experience, and powerful integrations.',
    primaryCta: {
      text: 'Get Started',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    socialProof: {
      rating: 4.8,
      reviews: 1234,
      text: 'Trusted by developers worldwide',
    },
    size: 'large',
  },
}

export const ExtraLargeSize: Story = {
  args: {
    announcement: {
      text: '🎉 Launch week special',
      variant: 'pill',
    },
    title: 'Transform your workflow',
    description:
      'The most powerful development platform ever created. Built for teams that demand excellence.',
    primaryCta: {
      text: 'Start Free Trial',
      href: '#',
    },
    secondaryCta: {
      text: 'Watch Demo',
      href: '#',
    },
    socialProof: {
      rating: 5.0,
      reviews: 500,
      text: 'Loved by enterprise teams',
    },
    size: 'xl',
  },
}

export const CustomIcon: Story = {
  args: {
    announcement: {
      text: 'AI-powered features now available',
      icon: '🤖',
      href: '#',
    },
    title: 'Build smarter with AI',
    description:
      'Leverage artificial intelligence to accelerate your development workflow and build better products faster.',
    primaryCta: {
      text: 'Try AI Features',
      href: '#',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '#',
    },
    socialProof: {
      rating: 4.9,
      reviews: 850,
      text: 'AI features rated by developers',
    },
  },
}
