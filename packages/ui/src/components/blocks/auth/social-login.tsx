import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface SocialProvider {
  name: string
  icon: React.ReactNode
  colorClass?: string
  bgClass?: string
}

export interface SocialLoginProps {
  providers: SocialProvider[]
  onLogin: (provider: string) => void | Promise<void>
  loading?: boolean | string // can be boolean or provider name that's loading
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  layout?: 'vertical' | 'horizontal'
  showLabel?: boolean
  className?: string
}

export const SocialLogin = ({
  providers,
  onLogin,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'default',
  layout = 'vertical',
  showLabel = true,
  className,
}: SocialLoginProps) => {
  const isProviderLoading = (provider: string) => {
    return loading === true || loading === provider
  }

  const layoutClass = layout === 'horizontal' ? 'flex flex-row gap-3' : 'flex flex-col gap-3'

  return (
    <div className={cn(layoutClass, className)}>
      {providers.map(provider => (
        <Button
          key={provider.name}
          className={cn(
            'w-full',
            provider.colorClass,
            provider.bgClass,
            layout === 'horizontal' && 'flex-1',
          )}
          disabled={disabled || loading !== false}
          size={size}
          variant={variant}
          onClick={() => onLogin(provider.name)}
        >
          {isProviderLoading(provider.name) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            provider.icon
          )}
          {showLabel && (
            <span className={cn(size === 'icon' && 'sr-only')}>
              {isProviderLoading(provider.name) ? 'Loading...' : `Continue with ${provider.name}`}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}

// Pre-configured social providers with icons
export const socialProviders = {
  google: {
    name: 'Google',
    icon: (
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
  github: {
    name: 'GitHub',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  twitter: {
    name: 'Twitter',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#f25022" />
        <path d="M24 11.4H12.6V0H24v11.4z" fill="#00a4ef" />
        <path d="M11.4 24H0V12.6h11.4V24z" fill="#7fba00" />
        <path d="M24 24H12.6V12.6H24V24z" fill="#ffb900" />
      </svg>
    ),
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  discord: {
    name: 'Discord',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  gitlab: {
    name: 'GitLab',
    icon: (
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1343a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1343 2.462-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z" />
      </svg>
    ),
  },
  slack: {
    name: 'Slack',
    icon: (
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M5.042 11.784a2.126 2.126 0 1 1-2.126-2.126h2.126v2.126zm1.063 0a2.126 2.126 0 0 1 4.252 0v5.315a2.126 2.126 0 1 1-4.252 0v-5.315z"
          fill="#E01E5A"
        />
        <path
          d="M8.231 5.042a2.126 2.126 0 1 1 2.126-2.126v2.126H8.231zm0 1.063a2.126 2.126 0 0 1 0 4.252H2.916a2.126 2.126 0 0 1 0-4.252h5.315z"
          fill="#36C5F0"
        />
        <path
          d="M18.958 12.216a2.126 2.126 0 1 1 2.126 2.126h-2.126v-2.126zm-1.063 0a2.126 2.126 0 0 1-4.252 0V6.901a2.126 2.126 0 1 1 4.252 0v5.315z"
          fill="#2EB67D"
        />
        <path
          d="M15.769 18.958a2.126 2.126 0 1 1-2.126 2.126v-2.126h2.126zm0-1.063a2.126 2.126 0 0 1 0-4.252h5.315a2.126 2.126 0 0 1 0 4.252h-5.315z"
          fill="#ECB22E"
        />
      </svg>
    ),
  },
}
