import type { Meta, StoryObj } from '@storybook/react'
import { FeaturesAlternating } from './features-alternating'
import { BarChart3, Code2, Database, Rocket, Shield, Users } from 'lucide-react'

const meta: Meta<typeof FeaturesAlternating> = {
  title: 'Blocks/Marketing/Landing/FeaturesAlternating',
  component: FeaturesAlternating,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FeaturesAlternating>

const sampleFeatures = [
  {
    badge: 'Performance',
    title: 'Lightning Fast',
    description:
      'Built for speed and performance, ensuring your applications run smoothly. Our platform is optimized for maximum efficiency and minimal latency.',
    image: {
      src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      alt: 'Performance dashboard showing fast response times',
    },
    icon: Rocket,
    highlights: [
      'Sub-100ms response times',
      'Global CDN integration',
      'Automatic scaling',
      'Real-time performance monitoring',
    ],
  },
  {
    badge: 'Security',
    title: 'Enterprise Security',
    description:
      'Advanced security features to protect your data and applications. We implement industry-leading security measures to keep your information safe.',
    image: {
      src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      alt: 'Security dashboard showing threat detection',
    },
    icon: Shield,
    highlights: [
      'End-to-end encryption',
      'Regular security audits',
      'Compliance certifications',
      'Advanced threat detection',
    ],
  },
  {
    badge: 'Development',
    title: 'Developer First',
    description:
      'Designed with developers in mind, making it easy to build and deploy. Our intuitive tools and comprehensive documentation help you get started quickly.',
    image: {
      src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
      alt: 'Developer working on code',
    },
    icon: Code2,
    highlights: [
      'Comprehensive API documentation',
      'SDKs for all major languages',
      'CLI tools for automation',
      'Extensive code examples',
    ],
  },
]

export const Default: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures,
  },
}

export const WithoutTitle: Story = {
  args: {
    features: sampleFeatures,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Everything you need',
    features: sampleFeatures,
  },
}

export const WithoutBadges: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures.map(({ badge, ...feature }) => feature),
  },
}

export const WithoutIcons: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures.map(({ icon, ...feature }) => feature),
  },
}

export const WithoutHighlights: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: sampleFeatures.map(({ highlights, ...feature }) => feature),
  },
}

export const LongTitles: Story = {
  args: {
    title: 'Everything you need to build and scale your applications',
    description:
      'Powerful features to help you build better applications faster and more efficiently than ever before',
    features: [
      {
        badge: 'Performance',
        title: 'Lightning Fast Performance and Scalability',
        description:
          'Built for speed and performance, ensuring your applications run smoothly. Our platform is optimized for maximum efficiency and minimal latency.',
        image: {
          src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Performance dashboard showing fast response times',
        },
        icon: Rocket,
        highlights: [
          'Sub-100ms response times',
          'Global CDN integration',
          'Automatic scaling',
          'Real-time performance monitoring',
        ],
      },
      {
        badge: 'Security',
        title: 'Enterprise-grade Security and Compliance',
        description:
          'Advanced security features to protect your data and applications. We implement industry-leading security measures to keep your information safe.',
        image: {
          src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Security dashboard showing threat detection',
        },
        icon: Shield,
        highlights: [
          'End-to-end encryption',
          'Regular security audits',
          'Compliance certifications',
          'Advanced threat detection',
        ],
      },
      {
        badge: 'Development',
        title: 'Developer-first Experience and Tools',
        description:
          'Designed with developers in mind, making it easy to build and deploy. Our intuitive tools and comprehensive documentation help you get started quickly.',
        image: {
          src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Developer working on code',
        },
        icon: Code2,
        highlights: [
          'Comprehensive API documentation',
          'SDKs for all major languages',
          'CLI tools for automation',
          'Extensive code examples',
        ],
      },
    ],
  },
}

export const LongDescriptions: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      {
        badge: 'Performance',
        title: 'Lightning Fast',
        description:
          "Built for speed and performance, ensuring your applications run smoothly. Our platform is optimized for maximum efficiency and minimal latency. We've spent years perfecting our infrastructure to deliver the fastest possible experience to your users, no matter where they are in the world.",
        image: {
          src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Performance dashboard showing fast response times',
        },
        icon: Rocket,
        highlights: [
          'Sub-100ms response times',
          'Global CDN integration',
          'Automatic scaling',
          'Real-time performance monitoring',
        ],
      },
      {
        badge: 'Security',
        title: 'Enterprise Security',
        description:
          'Advanced security features to protect your data and applications. We implement industry-leading security measures to keep your information safe. Our security team works around the clock to ensure your data is protected from the latest threats and vulnerabilities.',
        image: {
          src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Security dashboard showing threat detection',
        },
        icon: Shield,
        highlights: [
          'End-to-end encryption',
          'Regular security audits',
          'Compliance certifications',
          'Advanced threat detection',
        ],
      },
      {
        badge: 'Development',
        title: 'Developer First',
        description:
          'Designed with developers in mind, making it easy to build and deploy. Our intuitive tools and comprehensive documentation help you get started quickly. We understand the challenges developers face and have built our platform to address them directly.',
        image: {
          src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Developer working on code',
        },
        icon: Code2,
        highlights: [
          'Comprehensive API documentation',
          'SDKs for all major languages',
          'CLI tools for automation',
          'Extensive code examples',
        ],
      },
    ],
  },
}

export const ManyHighlights: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      {
        badge: 'Performance',
        title: 'Lightning Fast',
        description: 'Built for speed and performance, ensuring your applications run smoothly.',
        image: {
          src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Performance dashboard showing fast response times',
        },
        icon: Rocket,
        highlights: [
          'Sub-100ms response times',
          'Global CDN integration',
          'Automatic scaling',
          'Real-time performance monitoring',
          'Load balancing',
          'Caching optimization',
          'Database query optimization',
          'Asset compression',
        ],
      },
      {
        badge: 'Security',
        title: 'Enterprise Security',
        description: 'Advanced security features to protect your data and applications.',
        image: {
          src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Security dashboard showing threat detection',
        },
        icon: Shield,
        highlights: [
          'End-to-end encryption',
          'Regular security audits',
          'Compliance certifications',
          'Advanced threat detection',
          'DDoS protection',
          'Firewall configuration',
          'Access control',
          'Security monitoring',
        ],
      },
      {
        badge: 'Development',
        title: 'Developer First',
        description: 'Designed with developers in mind, making it easy to build and deploy.',
        image: {
          src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Developer working on code',
        },
        icon: Code2,
        highlights: [
          'Comprehensive API documentation',
          'SDKs for all major languages',
          'CLI tools for automation',
          'Extensive code examples',
          'Development environment setup',
          'Testing frameworks',
          'Debugging tools',
          'Performance profiling',
        ],
      },
    ],
  },
}

export const DifferentIcons: Story = {
  args: {
    title: 'Everything you need',
    description: 'Powerful features to help you build better applications faster',
    features: [
      {
        badge: 'Analytics',
        title: 'Advanced Analytics',
        description: "Get insights into your application's performance and usage.",
        image: {
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Analytics dashboard showing key metrics',
        },
        icon: BarChart3,
        highlights: [
          'Real-time metrics',
          'Custom dashboards',
          'Export capabilities',
          'Automated reports',
        ],
      },
      {
        badge: 'Database',
        title: 'Scalable Database',
        description: 'Powerful database features for storing and managing your data.',
        image: {
          src: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Database management interface',
        },
        icon: Database,
        highlights: [
          'Automatic backups',
          'Data replication',
          'Query optimization',
          'Schema management',
        ],
      },
      {
        badge: 'Collaboration',
        title: 'Team Collaboration',
        description: 'Work together seamlessly with built-in collaboration tools.',
        image: {
          src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
          alt: 'Team collaboration interface',
        },
        icon: Users,
        highlights: ['Real-time editing', 'Version control', 'Team chat', 'Task management'],
      },
    ],
  },
}
