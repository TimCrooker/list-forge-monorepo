import type { Meta, StoryObj } from '@storybook/react'
import { StatsSimple } from './stats-simple'
import { BarChart3, DollarSign, Globe, Users } from 'lucide-react'

const meta: Meta<typeof StatsSimple> = {
  title: 'Blocks/Marketing/Landing/StatsSimple',
  component: StatsSimple,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof StatsSimple>

const sampleStats = [
  {
    label: 'Total Revenue',
    value: 45000,
    prefix: '$',
    description: 'From January to December',
    icon: DollarSign,
    trend: {
      value: 12,
      isPositive: true,
    },
  },
  {
    label: 'Active Users',
    value: 10000,
    suffix: '+',
    description: 'Across all platforms',
    icon: Users,
    trend: {
      value: 8,
      isPositive: true,
    },
  },
  {
    label: 'Global Reach',
    value: 150,
    suffix: ' countries',
    description: 'Serving customers worldwide',
    icon: Globe,
    trend: {
      value: 5,
      isPositive: true,
    },
  },
  {
    label: 'Conversion Rate',
    value: 3.2,
    suffix: '%',
    description: 'Average across all channels',
    icon: BarChart3,
    trend: {
      value: 2,
      isPositive: false,
    },
  },
]

export const Default: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats,
  },
}

export const WithoutTitle: Story = {
  args: {
    stats: sampleStats,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    stats: sampleStats,
  },
}

export const TwoColumns: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats,
    columns: 2,
  },
}

export const ThreeColumns: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats,
    columns: 3,
  },
}

export const WithoutIcons: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats.map(({ icon, ...stat }) => stat),
  },
}

export const WithoutDescriptions: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats.map(({ description, ...stat }) => stat),
  },
}

export const WithoutTrends: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: sampleStats.map(({ trend, ...stat }) => stat),
  },
}

export const LongLabels: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: [
      {
        label: 'Total Annual Revenue Generated',
        value: 45000,
        prefix: '$',
        description: 'From January to December',
        icon: DollarSign,
        trend: {
          value: 12,
          isPositive: true,
        },
      },
      {
        label: 'Total Number of Active Users',
        value: 10000,
        suffix: '+',
        description: 'Across all platforms',
        icon: Users,
        trend: {
          value: 8,
          isPositive: true,
        },
      },
      {
        label: 'Number of Countries with Active Users',
        value: 150,
        suffix: ' countries',
        description: 'Serving customers worldwide',
        icon: Globe,
        trend: {
          value: 5,
          isPositive: true,
        },
      },
      {
        label: 'Average Conversion Rate Across All Channels',
        value: 3.2,
        suffix: '%',
        description: 'Average across all channels',
        icon: BarChart3,
        trend: {
          value: 2,
          isPositive: false,
        },
      },
    ],
  },
}

export const LongDescriptions: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: [
      {
        label: 'Total Revenue',
        value: 45000,
        prefix: '$',
        description:
          'From January to December, showing strong growth across all business segments and regions',
        icon: DollarSign,
        trend: {
          value: 12,
          isPositive: true,
        },
      },
      {
        label: 'Active Users',
        value: 10000,
        suffix: '+',
        description: 'Across all platforms, including web, mobile, and desktop applications',
        icon: Users,
        trend: {
          value: 8,
          isPositive: true,
        },
      },
      {
        label: 'Global Reach',
        value: 150,
        suffix: ' countries',
        description:
          'Serving customers worldwide with localized content and support in multiple languages',
        icon: Globe,
        trend: {
          value: 5,
          isPositive: true,
        },
      },
      {
        label: 'Conversion Rate',
        value: 3.2,
        suffix: '%',
        description:
          'Average across all channels, including organic search, paid advertising, and social media',
        icon: BarChart3,
        trend: {
          value: 2,
          isPositive: false,
        },
      },
    ],
  },
}

export const DifferentIcons: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: [
      {
        label: 'Revenue Growth',
        value: 45,
        suffix: '%',
        description: 'Year over year growth',
        icon: BarChart3,
        trend: {
          value: 12,
          isPositive: true,
        },
      },
      {
        label: 'Customer Satisfaction',
        value: 98,
        suffix: '%',
        description: 'Based on customer surveys',
        icon: Users,
        trend: {
          value: 3,
          isPositive: true,
        },
      },
      {
        label: 'Market Share',
        value: 25,
        suffix: '%',
        description: 'In our target market',
        icon: Globe,
        trend: {
          value: 5,
          isPositive: true,
        },
      },
      {
        label: 'Profit Margin',
        value: 32,
        suffix: '%',
        description: 'Average across all products',
        icon: DollarSign,
        trend: {
          value: 4,
          isPositive: true,
        },
      },
    ],
  },
}

export const ManyStats: Story = {
  args: {
    title: 'Trusted by businesses worldwide',
    description: 'Our platform helps companies of all sizes achieve their goals',
    stats: [
      ...sampleStats,
      {
        label: 'Customer Retention',
        value: 95,
        suffix: '%',
        description: 'Year over year',
        icon: Users,
        trend: {
          value: 3,
          isPositive: true,
        },
      },
      {
        label: 'Average Order Value',
        value: 150,
        prefix: '$',
        description: 'Across all channels',
        icon: DollarSign,
        trend: {
          value: 7,
          isPositive: true,
        },
      },
      {
        label: 'Response Time',
        value: 2.5,
        suffix: 's',
        description: 'Average page load time',
        icon: BarChart3,
        trend: {
          value: 15,
          isPositive: true,
        },
      },
      {
        label: 'API Uptime',
        value: 99.9,
        suffix: '%',
        description: 'Last 12 months',
        icon: Globe,
        trend: {
          value: 0.1,
          isPositive: true,
        },
      },
    ],
  },
}
