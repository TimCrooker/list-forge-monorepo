import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { TwoFactorSetup, TwoFactorVerification } from './two-factor-auth'

const meta = {
  title: 'Blocks/Auth/TwoFactorAuth',
  component: TwoFactorSetup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TwoFactorSetup>

export default meta
type Story = StoryObj<typeof meta>

// Sample QR code URL and secret
const sampleQrCodeUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const sampleSecret = 'JBSWY3DPEHPK3PXP'

export const SetupDefault: Story = {
  args: {
    onEnable: method => {
      // Enable 2FA with: method
      return Promise.resolve()
    },
    onVerify: code => {
      // Verify code: code
      return Promise.resolve()
    },
    onDisable: () => {
      // Disable 2FA
      return Promise.resolve()
    },
    onBack: () => {
      // Back clicked
    },
  },
}

export const SetupWithQRCode: Story = {
  args: {
    ...SetupDefault.args,
    qrCodeUrl: sampleQrCodeUrl,
    secret: sampleSecret,
  },
}

export const SetupWithPhone: Story = {
  args: {
    ...SetupDefault.args,
    phoneNumber: '+1 (555) 123-4567',
  },
}

export const SetupWithEmail: Story = {
  args: {
    ...SetupDefault.args,
    email: 'user@example.com',
  },
}

export const SetupLoading: Story = {
  args: {
    ...SetupDefault.args,
    loading: true,
  },
}

export const SetupWithError: Story = {
  args: {
    ...SetupDefault.args,
    error: 'Failed to enable two-factor authentication. Please try again.',
  },
}

export const SetupEnabled: Story = {
  args: {
    ...SetupDefault.args,
    isEnabled: true,
    enabledMethod: 'app',
  },
}

export const SetupEnabledSMS: Story = {
  args: {
    ...SetupDefault.args,
    isEnabled: true,
    enabledMethod: 'sms',
    phoneNumber: '+1 (555) 123-4567',
  },
}

export const SetupEnabledEmail: Story = {
  args: {
    ...SetupDefault.args,
    isEnabled: true,
    enabledMethod: 'email',
    email: 'user@example.com',
  },
}

export const SetupWithoutDisable: Story = {
  args: {
    ...SetupDefault.args,
    isEnabled: true,
    enabledMethod: 'app',
    onDisable: undefined,
  },
}

export const SetupWithoutBack: Story = {
  args: {
    ...SetupDefault.args,
    onBack: undefined,
  },
}

export const SetupWithCustomClassName: Story = {
  args: {
    ...SetupDefault.args,
    className: 'border-2 border-blue-500',
  },
}

// TwoFactorVerification stories
export const VerificationDefault: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
    />
  ),
}

export const VerificationSMS: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      method="sms"
      destination="+1 (555) 123-4567"
    />
  ),
}

export const VerificationEmail: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      method="email"
      destination="user@example.com"
    />
  ),
}

export const VerificationLoading: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      loading={true}
    />
  ),
}

export const VerificationResending: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      resending={true}
    />
  ),
}

export const VerificationWithError: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      error="Invalid verification code. Please try again."
    />
  ),
}

export const VerificationWithoutResend: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
    />
  ),
}

export const VerificationWithoutBackup: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
    />
  ),
}

export const VerificationCustomTitle: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      title="Verify Your Identity"
      description="Enter the 6-digit code from your authenticator app"
    />
  ),
}

export const VerificationWithCustomClassName: Story = {
  args: {
    onEnable: () => Promise.resolve(),
    onVerify: () => Promise.resolve(),
  },
  render: () => (
    <TwoFactorVerification
      onSubmit={code => {
        // Submit code: code
        return Promise.resolve()
      }}
      onResendCode={() => {
        // Resend code
        return Promise.resolve()
      }}
      onUseBackupCode={() => {
        // Use backup code
      }}
      className="border-2 border-blue-500"
    />
  ),
}
