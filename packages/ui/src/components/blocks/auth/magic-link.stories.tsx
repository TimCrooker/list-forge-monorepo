import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MagicLinkForm, MagicLinkVerification } from './magic-link'

const meta = {
  title: 'Blocks/Auth/MagicLink',
  component: MagicLinkForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MagicLinkForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: values => {
      // Submit: values
      return Promise.resolve()
    },
    onBack: () => {
      // Back clicked
    },
    onResend: () => {
      // Resend clicked
      return Promise.resolve()
    },
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const Resending: Story = {
  args: {
    ...Default.args,
    resending: true,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Failed to send magic link. Please try again.',
  },
}

export const CustomTitle: Story = {
  args: {
    ...Default.args,
    title: 'Login with Magic Link',
    description: 'Enter your email to receive a secure login link',
  },
}

export const WithoutIcon: Story = {
  args: {
    ...Default.args,
    showIcon: false,
  },
}

export const CustomSuccessMessage: Story = {
  args: {
    ...Default.args,
    successMessage: 'Your magic link is on its way! Check your inbox.',
  },
}

export const WithoutBackButton: Story = {
  args: {
    onSubmit: values => {
      // Submit: values
      return Promise.resolve()
    },
    onResend: () => {
      // Resend clicked
      return Promise.resolve()
    },
  },
}

export const WithoutResend: Story = {
  args: {
    onSubmit: values => {
      // Submit: values
      return Promise.resolve()
    },
    onBack: () => {
      // Back clicked
    },
  },
}

export const WithCustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'border-2 border-blue-500',
  },
}

// MagicLinkVerification stories
export const VerificationDefault: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onResend={() => {
        // Resend clicked
      }}
      onCancel={() => {
        // Cancel clicked
      }}
      token="sample-token"
      email="user@example.com"
    />
  ),
}

export const VerificationLoading: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onResend={() => {
        // Resend clicked
      }}
      onCancel={() => {
        // Cancel clicked
      }}
      token="sample-token"
      email="user@example.com"
      loading={true}
    />
  ),
}

export const VerificationWithError: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onResend={() => {
        // Resend clicked
      }}
      onCancel={() => {
        // Cancel clicked
      }}
      token="sample-token"
      email="user@example.com"
      error="Invalid or expired token. Please request a new magic link."
    />
  ),
}

export const VerificationWithoutCancel: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onResend={() => {
        // Resend clicked
      }}
      token="sample-token"
      email="user@example.com"
    />
  ),
}

export const VerificationWithoutResend: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onCancel={() => {
        // Cancel clicked
      }}
      token="sample-token"
      email="user@example.com"
    />
  ),
}

export const VerificationWithCustomClassName: Story = {
  args: {
    onSubmit: () => Promise.resolve(),
  },
  render: () => (
    <MagicLinkVerification
      onVerify={() => {
        // Verify clicked
      }}
      onResend={() => {
        // Resend clicked
      }}
      onCancel={() => {
        // Cancel clicked
      }}
      token="sample-token"
      email="user@example.com"
      className="border-2 border-blue-500"
    />
  ),
}
