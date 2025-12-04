import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from './login-form'
import { Github, Mail, User, Building2 } from 'lucide-react'

const meta = {
  title: 'Blocks/Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    fieldConfig: {
      control: 'object',
      description: 'Configuration for the main input field',
    },
    passwordConfig: {
      control: 'object',
      description: 'Configuration for the password field',
    },
    showSocialLogin: {
      control: 'boolean',
      description: 'Whether to show social login options',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
} satisfies Meta<typeof LoginForm>

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
    },
    onForgotPassword: () => {
      // Forgot password clicked
    },
    onSignUp: () => {
      // Sign up clicked
    },
    onSocialLogin: provider => {
      // Social login: provider
    },
    title: 'Welcome back',
    description: 'Enter your credentials to access your account',
    socialProviders,
  },
}

export const WithUsernameField: Story = {
  args: {
    ...Default.args,
    title: 'Internal User Login',
    description: 'Sign in with your username and password',
    fieldConfig: {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Enter your username',
      icon: <User className="h-4 w-4" />,
      helpText: 'Use your system username',
    },
    passwordConfig: {
      label: 'Password',
      placeholder: 'Enter your password',
      helpText: 'Use your system password',
    },
    showSocialLogin: false,
  },
}

export const WithFlexibleIdentifier: Story = {
  args: {
    ...Default.args,
    title: 'Flexible Login',
    description: 'Sign in with your email or username',
    fieldConfig: {
      name: 'identifier',
      label: 'Email or Username',
      type: 'text',
      placeholder: 'Enter your email or username',
      icon: <Mail className="h-4 w-4" />,
      helpText: 'You can use either your email address or username',
    },
    passwordConfig: {
      label: 'Password',
      placeholder: 'Enter your password',
    },
    showSocialLogin: true,
  },
}

export const WithCustomStyling: Story = {
  args: {
    ...Default.args,
    title: 'Enterprise Portal',
    description: 'Access your corporate account',
    fieldConfig: {
      name: 'email',
      label: 'Corporate Email',
      type: 'email',
      placeholder: 'your.name@company.com',
      icon: <Building2 className="h-4 w-4" />,
      helpText: 'Use your company email address',
    },
    passwordConfig: {
      label: 'Password',
      placeholder: 'Enter your corporate password',
      helpText: 'Use your Active Directory password',
    },
    showSocialLogin: false,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Invalid email or password. Please try again.',
  },
}

export const LoadingState: Story = {
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

export const WithoutSignUp: Story = {
  args: {
    ...Default.args,
    onSignUp: undefined,
  },
}

export const WithoutForgotPassword: Story = {
  args: {
    ...Default.args,
    onForgotPassword: undefined,
  },
}

export const MinimalConfiguration: Story = {
  args: {
    onSubmit: values => {
      // Form submitted: values
    },
    title: 'Sign In',
    description: 'Enter your credentials',
    fieldConfig: {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email',
    },
    passwordConfig: {
      placeholder: 'Enter password',
    },
    showSocialLogin: false,
  },
}
