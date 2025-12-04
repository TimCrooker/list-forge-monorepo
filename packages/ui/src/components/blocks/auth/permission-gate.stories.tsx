import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  PermissionGate,
  PermissionError,
  RoleIndicator,
  FeatureFlag,
  SecureContent,
} from './permission-gate'

const meta = {
  title: 'Blocks/Auth/PermissionGate',
  component: PermissionGate,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PermissionGate>

export default meta
type Story = StoryObj<typeof meta>

// Sample content
const ProtectedContent = () => (
  <div className="p-4 bg-muted rounded-lg">
    <h3 className="text-lg font-semibold">Protected Content</h3>
    <p className="text-sm text-muted-foreground">
      This content is only visible to users with the required permissions.
    </p>
  </div>
)

// Sample user data
const adminUser = {
  roles: ['admin'],
  permissions: ['read', 'write', 'delete', 'manage_users'],
}

const editorUser = {
  roles: ['editor'],
  permissions: ['read', 'write'],
}

const viewerUser = {
  roles: ['viewer'],
  permissions: ['read'],
}

export const Default: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['read'],
    userPermissions: viewerUser.permissions,
  },
}

export const WithRoles: Story = {
  args: {
    children: <ProtectedContent />,
    roles: ['admin'],
    userRoles: adminUser.roles,
  },
}

export const WithMultiplePermissions: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['read', 'write'],
    userPermissions: editorUser.permissions,
  },
}

export const WithMultipleRoles: Story = {
  args: {
    children: <ProtectedContent />,
    roles: ['admin', 'editor'],
    userRoles: editorUser.roles,
  },
}

export const RequireAllPermissions: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['read', 'write', 'delete'],
    userPermissions: editorUser.permissions,
    requireAll: true,
  },
}

export const RequireAllRoles: Story = {
  args: {
    children: <ProtectedContent />,
    roles: ['admin', 'editor'],
    userRoles: adminUser.roles,
    requireAll: true,
  },
}

export const WithCustomFallback: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['admin'],
    userPermissions: viewerUser.permissions,
    fallback: <div className="p-4 bg-yellow-100 rounded-lg">Custom fallback content</div>,
  },
}

export const WithoutError: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['admin'],
    userPermissions: viewerUser.permissions,
    showError: false,
  },
}

export const WithCustomError: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['admin'],
    userPermissions: viewerUser.permissions,
    errorTitle: 'Restricted Access',
    errorDescription: 'This area is restricted to administrators only.',
  },
}

export const WithUnauthorizedCallback: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['admin'],
    userPermissions: viewerUser.permissions,
    onUnauthorized: () => {
      // Unauthorized access attempt
    },
  },
}

export const WithCustomClassName: Story = {
  args: {
    children: <ProtectedContent />,
    permissions: ['admin'],
    userPermissions: viewerUser.permissions,
    className: 'border-2 border-blue-500 rounded-lg',
  },
}

// PermissionError stories
export const PermissionErrorDefault: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <PermissionError
      title="Access Denied"
      description="You don't have permission to view this content."
      requiredPermissions={['read', 'write']}
      requiredRoles={['admin']}
    />
  ),
}

export const PermissionErrorWithActions: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <PermissionError
      title="Access Denied"
      description="You don't have permission to view this content."
      requiredPermissions={['read', 'write']}
      requiredRoles={['admin']}
      onRequestAccess={() => {
        // Request access clicked
      }}
      onGoBack={() => {
        // Go back clicked
      }}
    />
  ),
}

export const PermissionErrorWithoutDetails: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <PermissionError
      title="Access Denied"
      description="You don't have permission to view this content."
      showDetails={false}
    />
  ),
}

// RoleIndicator stories
export const RoleIndicatorDefault: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => <RoleIndicator roles={['admin', 'editor']} />,
}

export const RoleIndicatorSmall: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => <RoleIndicator roles={['admin']} size="sm" />,
}

export const RoleIndicatorLarge: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => <RoleIndicator roles={['admin', 'editor', 'viewer']} size="lg" />,
}

export const RoleIndicatorOutline: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => <RoleIndicator roles={['admin']} variant="outline" />,
}

export const RoleIndicatorSecondary: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => <RoleIndicator roles={['admin']} variant="secondary" />,
}

// FeatureFlag stories
export const FeatureFlagEnabled: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <FeatureFlag flag="beta" enabledFlags={['beta']}>
      <div className="p-4 bg-muted rounded-lg">Beta feature content</div>
    </FeatureFlag>
  ),
}

export const FeatureFlagDisabled: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <FeatureFlag flag="beta" enabledFlags={['alpha']}>
      <div className="p-4 bg-muted rounded-lg">Beta feature content</div>
    </FeatureFlag>
  ),
}

export const FeatureFlagWithFallback: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <FeatureFlag
      flag="beta"
      enabledFlags={['alpha']}
      fallback={<div className="p-4 bg-yellow-100 rounded-lg">Feature coming soon!</div>}
    >
      <div className="p-4 bg-muted rounded-lg">Beta feature content</div>
    </FeatureFlag>
  ),
}

// SecureContent stories
export const SecureContentAuthenticated: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <SecureContent isAuthenticated={true}>
      <div className="p-4 bg-muted rounded-lg">Secure content</div>
    </SecureContent>
  ),
}

export const SecureContentUnauthenticated: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <SecureContent
      isAuthenticated={false}
      loginUrl="/login"
      onLogin={() => {
        // Login clicked
      }}
    >
      <div className="p-4 bg-muted rounded-lg">Secure content</div>
    </SecureContent>
  ),
}

export const SecureContentLoading: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <SecureContent isAuthenticated={false} isLoading={true}>
      <div className="p-4 bg-muted rounded-lg">Secure content</div>
    </SecureContent>
  ),
}

export const SecureContentCustomMessage: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <SecureContent isAuthenticated={false} message="Please sign in to access this premium content">
      <div className="p-4 bg-muted rounded-lg">Secure content</div>
    </SecureContent>
  ),
}
