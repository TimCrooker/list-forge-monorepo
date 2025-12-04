import type { Meta, StoryObj } from '@storybook/react'
import { FeaturesGrid } from './features-grid'
import {
  BarChart3,
  Code2,
  Database,
  FileCode2,
  Globe,
  Lock,
  MessageSquare,
  Rocket,
  Settings,
  Shield,
  Users,
  Zap,
} from 'lucide-react'

const meta: Meta<typeof FeaturesGrid> = {
  title: 'Blocks/Marketing/Landing/FeaturesGrid',
  component: FeaturesGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FeaturesGrid>

const sampleFeatures = [
  {
    icon: Rocket,
    title: 'Lightning Fast',
    description: 'Built for speed and performance, ensuring your applications run smoothly.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Advanced security features to protect your data and applications.',
  },
  {
    icon: Code2,
    title: 'Developer First',
    description: 'Designed with developers in mind, making it easy to build and deploy.',
  },
  {
    icon: Database,
    title: 'Scalable Infrastructure',
    description: 'Grow your applications with our flexible and scalable infrastructure.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with built-in collaboration tools.',
  },
  {
    icon: Settings,
    title: 'Easy Integration',
    description: 'Connect with your favorite tools and services effortlessly.',
  },
]

export const Default: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures,
    columns: 3,
  },
}

export const TwoColumns: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures,
    columns: 2,
  },
}

export const FourColumns: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      ...sampleFeatures,
      {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: "Get insights into your application's performance and usage.",
      },
      {
        icon: MessageSquare,
        title: 'Real-time Chat',
        description: 'Built-in chat functionality for seamless communication.',
      },
    ],
    columns: 4,
  },
}

export const WithoutTitle: Story = {
  args: {
    features: sampleFeatures,
    columns: 3,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Everything you need',
    features: sampleFeatures,
    columns: 3,
  },
}

export const LongTitles: Story = {
  args: {
    title: 'Everything you need to build and scale your applications',
    description:
      'Powerful features to help you build better applications faster and more efficiently than ever before',
    features: [
      {
        icon: Rocket,
        title: 'Lightning Fast Performance and Scalability',
        description: 'Built for speed and performance, ensuring your applications run smoothly.',
      },
      {
        icon: Shield,
        title: 'Enterprise-grade Security and Compliance',
        description: 'Advanced security features to protect your data and applications.',
      },
      {
        icon: Code2,
        title: 'Developer-first Experience and Tools',
        description: 'Designed with developers in mind, making it easy to build and deploy.',
      },
      {
        icon: Database,
        title: 'Highly Scalable and Flexible Infrastructure',
        description: 'Grow your applications with our flexible and scalable infrastructure.',
      },
      {
        icon: Users,
        title: 'Advanced Team Collaboration Features',
        description: 'Work together seamlessly with built-in collaboration tools.',
      },
      {
        icon: Settings,
        title: 'Seamless Third-party Integration Support',
        description: 'Connect with your favorite tools and services effortlessly.',
      },
    ],
    columns: 3,
  },
}

export const LongDescriptions: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      {
        icon: Rocket,
        title: 'Lightning Fast',
        description:
          'Built for speed and performance, ensuring your applications run smoothly. Our platform is optimized for maximum efficiency and minimal latency.',
      },
      {
        icon: Shield,
        title: 'Enterprise Security',
        description:
          'Advanced security features to protect your data and applications. We implement industry-leading security measures to keep your information safe.',
      },
      {
        icon: Code2,
        title: 'Developer First',
        description:
          'Designed with developers in mind, making it easy to build and deploy. Our intuitive tools and comprehensive documentation help you get started quickly.',
      },
      {
        icon: Database,
        title: 'Scalable Infrastructure',
        description:
          'Grow your applications with our flexible and scalable infrastructure. Our platform automatically scales to meet your needs, no matter how large your user base grows.',
      },
      {
        icon: Users,
        title: 'Team Collaboration',
        description:
          'Work together seamlessly with built-in collaboration tools. Share code, track changes, and manage projects efficiently with your team.',
      },
      {
        icon: Settings,
        title: 'Easy Integration',
        description:
          'Connect with your favorite tools and services effortlessly. Our platform supports a wide range of integrations to enhance your workflow.',
      },
    ],
    columns: 3,
  },
}

export const DifferentIcons: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      {
        icon: Globe,
        title: 'Global CDN',
        description: 'Deliver content quickly to users worldwide with our global CDN.',
      },
      {
        icon: Lock,
        title: 'End-to-End Encryption',
        description: 'Secure your data with industry-standard encryption protocols.',
      },
      {
        icon: FileCode2,
        title: 'Code Generation',
        description: 'Generate boilerplate code and templates automatically.',
      },
      {
        icon: Zap,
        title: 'Instant Deployments',
        description: 'Deploy your applications with a single click or command.',
      },
      {
        icon: MessageSquare,
        title: 'Real-time Updates',
        description: 'Keep your team in sync with real-time updates and notifications.',
      },
      {
        icon: BarChart3,
        title: 'Performance Metrics',
        description: "Track and analyze your application's performance in real-time.",
      },
    ],
    columns: 3,
  },
}
