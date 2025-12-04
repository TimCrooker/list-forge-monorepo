import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SocialLogin, socialProviders } from './social-login'

const meta = {
  title: 'Blocks/Auth/SocialLogin',
  component: SocialLogin,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SocialLogin>

export default meta
type Story = StoryObj<typeof meta>

// Sample providers with custom styling
const customProviders = [
  {
    ...socialProviders.google,
    colorClass: 'text-white',
    bgClass: 'bg-[#4285F4] hover:bg-[#357ABD]',
  },
  {
    ...socialProviders.github,
    colorClass: 'text-white',
    bgClass: 'bg-[#24292E] hover:bg-[#1B1F23]',
  },
  {
    ...socialProviders.twitter,
    colorClass: 'text-white',
    bgClass: 'bg-[#1DA1F2] hover:bg-[#1A91DA]',
  },
]

export const Default: Story = {
  args: {
    providers: Object.values(socialProviders),
    onLogin: provider => {
      // Login with: provider
    },
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const LoadingSpecificProvider: Story = {
  args: {
    ...Default.args,
    loading: 'Google',
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
}

export const HorizontalLayout: Story = {
  args: {
    ...Default.args,
    layout: 'horizontal',
  },
}

export const WithoutLabels: Story = {
  args: {
    ...Default.args,
    showLabel: false,
  },
}

export const SmallSize: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
}

export const IconSize: Story = {
  args: {
    ...Default.args,
    size: 'icon',
  },
}

export const GhostVariant: Story = {
  args: {
    ...Default.args,
    variant: 'ghost',
  },
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default',
  },
}

export const WithCustomStyling: Story = {
  args: {
    providers: customProviders,
    onLogin: provider => {
      // Login with: provider
    },
  },
}

export const WithCustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'gap-4',
  },
}

export const SingleProvider: Story = {
  args: {
    providers: [socialProviders.google],
    onLogin: provider => {
      // Login with: provider
    },
  },
}

export const TwoProviders: Story = {
  args: {
    providers: [socialProviders.google, socialProviders.github],
    onLogin: provider => {
      // Login with: provider
    },
  },
}

export const ThreeProviders: Story = {
  args: {
    providers: [socialProviders.google, socialProviders.github, socialProviders.twitter],
    onLogin: provider => {
      // Login with: provider
    },
  },
}

export const AllProviders: Story = {
  args: {
    providers: Object.values(socialProviders),
    onLogin: provider => {
      // Login with: provider
    },
    layout: 'horizontal',
    className: 'flex-wrap',
  },
}
