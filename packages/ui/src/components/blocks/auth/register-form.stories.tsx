import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RegisterForm } from './register-form'
import { Github, Mail } from 'lucide-react'

const meta = {
  title: 'Blocks/Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RegisterForm>

export default meta
type Story = StoryObj<typeof meta>

// Sample social providers
const socialProviders = [
  {
    name: 'Google',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    icon: <Github className="h-5 w-5" />,
  },
  {
    name: 'Email',
    icon: <Mail className="h-5 w-5" />,
  },
]

export const Default: Story = {
  args: {
    onSubmit: values => {
      // Form submitted: values
      return Promise.resolve()
    },
    onSignIn: () => {
      // Sign in clicked
    },
    onSocialLogin: provider => {
      // Social login: provider
    },
    onTermsClick: () => {
      // Terms clicked
    },
    onPrivacyClick: () => {
      // Privacy clicked
    },
    title: 'Create an account',
    description: 'Enter your information to get started',
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'An account with this email already exists',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const WithoutSocialLogin: Story = {
  args: {
    ...Default.args,
    showSocialLogin: false,
  },
}

export const CustomSocialProviders: Story = {
  args: {
    ...Default.args,
    socialProviders,
  },
}

export const CustomTitle: Story = {
  args: {
    ...Default.args,
    title: 'Join our community',
    description: 'Create your account to get started',
  },
}

export const WithCustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'border-2 border-blue-500 rounded-lg',
  },
}

export const WithoutSignIn: Story = {
  args: {
    ...Default.args,
    onSignIn: undefined,
  },
}

export const WithoutTermsAndPrivacy: Story = {
  args: {
    ...Default.args,
    onTermsClick: undefined,
    onPrivacyClick: undefined,
  },
}

export const WithValidation: Story = {
  args: {
    ...Default.args,
    onSubmit: async values => {
      // Simulate validation error
      if (values.email === 'test@example.com') {
        throw new Error('Email already in use')
      }
      // Form submitted: values
    },
  },
}

export const WithMarketingEmailsDefault: Story = {
  args: {
    ...Default.args,
  },
}

export const WithPrefilledName: Story = {
  args: {
    ...Default.args,
  },
}

export const WithWeakPassword: Story = {
  args: {
    ...Default.args,
  },
}

export const WithStrongPassword: Story = {
  args: {
    ...Default.args,
  },
}

export const WithMismatchedPasswords: Story = {
  args: {
    ...Default.args,
  },
}
