import { cn } from '@/lib/utils'
import { listForgeLogo } from '@/data/logos'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: {
    full: 'h-8',
    icon: 'h-6 w-6',
    text: 'h-6',
  },
  md: {
    full: 'h-12',
    icon: 'h-8 w-8',
    text: 'h-8',
  },
  lg: {
    full: 'h-16',
    icon: 'h-10 w-10',
    text: 'h-10',
  },
  xl: {
    full: 'h-24',
    icon: 'h-16 w-16',
    text: 'h-16',
  },
}

export function Logo({ variant = 'full', className, size = 'md' }: LogoProps) {
  const logoSrc = listForgeLogo[variant]
  const sizeClass = sizeClasses[size][variant]
  const isIcon = variant === 'icon'

  return (
    <img
      src={logoSrc}
      alt="ListForge"
      className={cn(
        sizeClass,
        isIcon ? '' : 'w-auto',
        'object-contain',
        className
      )}
    />
  )
}
