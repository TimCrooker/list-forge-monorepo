import * as React from 'react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ShieldAlert, ShieldCheck, Lock, UserX, Info, AlertCircle } from 'lucide-react'

export interface PermissionGateProps {
  children: React.ReactNode
  permissions?: string[]
  roles?: string[]
  personas?: string[]
  userPermissions?: string[]
  userRoles?: string[]
  userPersonas?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showError?: boolean
  errorTitle?: string
  errorDescription?: string
  onUnauthorized?: () => void
  className?: string
}

export const PermissionGate = ({
  children,
  permissions = [],
  roles = [],
  personas = [],
  userPermissions = [],
  userRoles = [],
  userPersonas = [],
  requireAll = false,
  fallback,
  showError = true,
  errorTitle = 'Access Denied',
  errorDescription = "You don't have permission to view this content.",
  onUnauthorized,
  className,
}: PermissionGateProps) => {
  const hasRequiredPermissions = React.useMemo(() => {
    if (permissions.length === 0 && roles.length === 0 && personas.length === 0) {
      return true // No requirements, allow access
    }

    const hasPermission =
      permissions.length === 0 ||
      (requireAll
        ? permissions.every(p => userPermissions.includes(p))
        : permissions.some(p => userPermissions.includes(p)))

    const hasRole =
      roles.length === 0 ||
      (requireAll
        ? roles.every(r => userRoles.includes(r))
        : roles.some(r => userRoles.includes(r)))

    const hasPersona =
      personas.length === 0 ||
      (requireAll
        ? personas.every(p => userPersonas.includes(p))
        : personas.some(p => userPersonas.includes(p)))

    return requireAll
      ? hasPermission && hasRole && hasPersona
      : hasPermission || hasRole || hasPersona
  }, [permissions, roles, personas, userPermissions, userRoles, userPersonas, requireAll])

  React.useEffect(() => {
    if (!hasRequiredPermissions && onUnauthorized) {
      onUnauthorized()
    }
  }, [hasRequiredPermissions, onUnauthorized])

  if (hasRequiredPermissions) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showError) {
    return null
  }

  return (
    <PermissionError
      className={className}
      description={errorDescription}
      requiredPermissions={permissions}
      requiredRoles={roles}
      requiredPersonas={personas}
      title={errorTitle}
    />
  )
}

export interface PermissionErrorProps {
  title?: string
  description?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requiredPersonas?: string[]
  onRequestAccess?: () => void
  onGoBack?: () => void
  showDetails?: boolean
  className?: string
}

export const PermissionError = ({
  title = 'Access Denied',
  description = "You don't have permission to view this content.",
  requiredPermissions = [],
  requiredRoles = [],
  requiredPersonas = [],
  onRequestAccess,
  onGoBack,
  showDetails = true,
  className,
}: PermissionErrorProps) => {
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails &&
          (requiredPermissions.length > 0 ||
            requiredRoles.length > 0 ||
            requiredPersonas.length > 0) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Required Access</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {requiredRoles.length > 0 && (
                    <div>
                      <span className="font-medium">Roles:</span>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {requiredRoles.map(role => (
                          <li key={role}>{role}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {requiredPersonas.length > 0 && (
                    <div>
                      <span className="font-medium">Personas:</span>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {requiredPersonas.map(persona => (
                          <li key={persona}>{persona}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {requiredPermissions.length > 0 && (
                    <div>
                      <span className="font-medium">Permissions:</span>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {requiredPermissions.map(permission => (
                          <li key={permission}>{permission}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

        <div className="flex flex-col gap-2">
          {onRequestAccess && (
            <Button className="w-full" onClick={onRequestAccess}>
              Request Access
            </Button>
          )}
          {onGoBack && (
            <Button className="w-full" variant="outline" onClick={onGoBack}>
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export interface RoleIndicatorProps {
  roles: string[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export const RoleIndicator = ({
  roles,
  className,
  size = 'md',
  variant = 'default',
}: RoleIndicatorProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const iconSize = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <ShieldCheck className={cn(iconSize, 'text-muted-foreground')} />
      {roles.map(role => (
        <span
          key={role}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            variant === 'default' && 'bg-primary text-primary-foreground',
            variant === 'outline' && 'border border-input bg-background',
            variant === 'secondary' && 'bg-secondary text-secondary-foreground',
          )}
        >
          {role}
        </span>
      ))}
    </div>
  )
}

export interface FeatureFlagProps {
  children: React.ReactNode
  flag: string
  enabledFlags?: string[]
  fallback?: React.ReactNode
  showComingSoon?: boolean
}

export const FeatureFlag = ({
  children,
  flag,
  enabledFlags = [],
  fallback,
  showComingSoon = true,
}: FeatureFlagProps) => {
  const isEnabled = enabledFlags.includes(flag)

  if (isEnabled) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showComingSoon) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          This feature is not yet available. Stay tuned for updates!
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

export interface SecureContentProps {
  children: React.ReactNode
  isAuthenticated: boolean
  isLoading?: boolean
  loginUrl?: string
  onLogin?: () => void
  message?: string
  className?: string
}

export const SecureContent = ({
  children,
  isAuthenticated,
  isLoading = false,
  loginUrl,
  onLogin,
  message = 'Please sign in to view this content',
  className,
}: SecureContentProps) => {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Authentication Required</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {onLogin ? (
          <Button className="w-full" onClick={onLogin}>
            Sign In
          </Button>
        ) : loginUrl ? (
          <Button asChild className="w-full">
            <a href={loginUrl}>Sign In</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
